import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, copyFile, writeFile, symlink, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { once } from 'node:events';

test('Express builds a missing dashboard and serves its HTML and assets', { timeout: 60_000 }, async () => {
  const root = path.dirname(fileURLToPath(import.meta.url));
  const fixture = await mkdtemp(path.join(tmpdir(), 'myb-startup-'));
  let child;
  try {
    await copyFile(path.join(root, 'server.mjs'), path.join(fixture, 'server.mjs'));
    await copyFile(path.join(root, 'admin-auth.mjs'), path.join(fixture, 'admin-auth.mjs'));
    await writeFile(path.join(fixture, 'package.json'), JSON.stringify({ type: 'module' }));
    await writeFile(path.join(fixture, 'index.html'), '<html><body>Dashboard startup fixture<script type="module" src="/main.js"></script></body></html>');
    await writeFile(path.join(fixture, 'main.js'), 'document.body.dataset.ready = "true";');
    await symlink(path.join(root, 'node_modules'), path.join(fixture, 'node_modules'), 'junction');
    const port = 30000 + Math.floor(Math.random() * 10000);
    child = spawn(process.execPath, [path.join(fixture, 'server.mjs')], {
      cwd: root,
      env: { ...process.env, PORT: String(port), HOST: '127.0.0.1', NODE_ENV: 'test' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let output = '';
    let stderr = '';
    child.stderr.on('data', (data) => { stderr += data; });
    await Promise.race([
      new Promise((resolve) => child.stdout.on('data', (data) => {
        output += data;
        if (output.includes('Admin server running')) resolve();
      })),
      once(child, 'exit').then(() => { throw new Error('Startup failed: ' + stderr); }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Startup timeout: ' + stderr)), 45_000).unref()),
    ]);
    assert.match(output, /Dashboard build missing/);
    const base = `http://127.0.0.1:${port}`;
    const homepage = await fetch(base);
    assert.equal(homepage.status, 200);
    const html = await homepage.text();
    assert.match(html, /Dashboard startup fixture/);
    const asset = html.match(/src="([^"]+\.js)"/);
    assert.ok(asset, 'the built page references a bundled script');
    const script = await fetch(new URL(asset[1], base));
    assert.equal(script.status, 200);
    assert.match(await script.text(), /dataset.ready/);
    const session = await fetch(`${base}/api/admin/session`);
    assert.equal(session.status, 401);
    assert.deepEqual(await session.json(), { error: 'Please sign in.' });
  } finally {
    if (child && child.exitCode === null) {
      const exited = once(child, 'exit');
      child.kill();
      await exited;
    }
    const relative = path.relative(path.resolve(tmpdir()), path.resolve(fixture));
    assert.ok(relative && !relative.startsWith('..') && !path.isAbsolute(relative), 'cleanup stays within the temporary directory');
    await rm(fixture, { recursive: true, force: true });
  }
});
