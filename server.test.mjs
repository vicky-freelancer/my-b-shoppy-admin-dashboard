import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { scryptSync } from 'node:crypto';
import { fileURLToPath } from 'node:url';

for (const standaloneVite of [false, true]) {
test(`admin login, sessions, logout, origin checks and attempt limits (${standaloneVite ? 'standalone Vite' : 'Express'})`, async () => {
  const port = 20000 + Math.floor(Math.random() * 10000);
  const password = 'test-password-for-auth-only';
  const salt = 'auth-test-salt';
  const entry = standaloneVite ? './node_modules/vite/bin/vite.js' : './server.mjs';
  const args = standaloneVite ? ['--host', '127.0.0.1', '--port', String(port), '--strictPort'] : [];
  const child = spawn(process.execPath, [fileURLToPath(new URL(entry, import.meta.url)), ...args], {
    env: { ...process.env, PORT: String(port), NODE_ENV: 'test', ADMIN_USERNAME: 'qa-admin', ADMIN_PASSWORD_HASH: `${salt}:${scryptSync(password, salt, 64).toString('hex')}` },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let stderr = '';
  child.stderr.on('data', (data) => { stderr += data; });
  try {
    await Promise.race([
      new Promise((resolve) => child.stdout.on('data', (data) => { if (/Admin server running|Local:/.test(data.toString())) resolve(); })),
      once(child, 'exit').then(() => { throw new Error('Startup failed: ' + stderr); }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Startup timeout')), 15_000).unref()),
    ]);
    const base = `http://127.0.0.1:${port}`;
    const post = (route, body, headers = {}) => fetch(`${base}/api/admin/${route}`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) });
    assert.equal((await fetch(`${base}/api/admin/session`)).status, 401);
    assert.equal((await fetch(`${base}/api/admin/session`, { headers: { Cookie: 'myb_admin=forged' } })).status, 401);
    assert.equal((await post('login', { userId: 'qa-admin', password: 'wrong' })).status, 401);
    assert.equal((await post('login', { userId: 'wrong', password })).status, 401);
    assert.equal((await post('login', { userId: 1, password })).status, 400);
    assert.equal((await post('login', { userId: 'qa-admin', password }, { Origin: 'https://other.example' })).status, 403);
    const login = await post('login', { userId: 'qa-admin', password });
    assert.equal(login.status, 200);
    assert.equal(login.headers.get('cache-control'), 'no-store');
    const cookie = login.headers.get('set-cookie');
    assert.match(cookie, /HttpOnly/); assert.match(cookie, /SameSite=Strict/);
    const cookieHeader = cookie.split(';')[0];
    assert.equal((await login.json()).user.name, 'qa-admin');
    const session = await fetch(`${base}/api/admin/session`, { headers: { Cookie: cookieHeader } });
    assert.equal(session.status, 200);
    assert.equal((await session.json()).user.role, 'Super Admin');
    assert.equal((await post('logout', {}, { Cookie: cookieHeader })).status, 200);
    assert.equal((await fetch(`${base}/api/admin/session`, { headers: { Cookie: cookieHeader } })).status, 401);
    for (let i = 0; i < 5; i++) assert.equal((await post('login', { userId: 'qa-admin', password: 'wrong' })).status, 401);
    const limited = await post('login', { userId: 'qa-admin', password });
    assert.equal(limited.status, 429); assert.ok(Number(limited.headers.get('retry-after')) > 0);
    assert.equal((await fetch(`${base}/api/unknown`)).status, 404);
  } finally { child.kill(); await once(child, 'exit'); }
});
}
