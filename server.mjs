import 'dotenv/config';
import express from 'express';
import { createAdminAuthRouter } from './admin-auth.mjs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { existsSync } from 'node:fs';

const root = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '4kb' }));
app.use(createAdminAuthRouter());
app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found.' }));
if (process.argv.includes('--dev')) {
  const { createServer } = await import('vite');
  const vite = await createServer({ root, server: { middlewareMode: true }, appType: 'spa' });
  app.use(vite.middlewares);
} else {
  // Express-only hosts may start the entry file without running a frontend build.
  if (!existsSync(path.join(root, 'dist/index.html'))) {
    console.log('Dashboard build missing; building frontend before startup...');
    const { build } = await import('vite');
    await build({ root });
  }
  app.use(express.static(path.join(root, 'dist')));
  app.get('*', (_req, res) => res.sendFile(path.join(root, 'dist/index.html')));
}
const portFlagIndex = process.argv.indexOf('--port');
const portArg = process.argv.find((value) => value.startsWith('--port='))?.split('=')[1] || (portFlagIndex >= 0 ? process.argv[portFlagIndex + 1] : undefined);
const port = Number(process.env.PORT || portArg || 3000);
app.listen(port, process.env.HOST || '0.0.0.0', () => console.log(`Admin server running at http://localhost:${port}`));
