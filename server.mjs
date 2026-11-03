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
app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use(createAdminAuthRouter());
app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found.' }));
if (process.argv.includes('--dev')) {
  const { createServer } = await import('vite');
  const vite = await createServer({ root, server: { middlewareMode: true }, appType: 'spa' });
  app.use(vite.middlewares);
} else {
  const builtIndex = path.join(root, 'dist/index.html');
  if (!existsSync(builtIndex)) {
    if (process.env.NODE_ENV === 'production') {
      console.error('Dashboard build missing. Run "npm run build" before starting the server.');
      process.exit(1);
    }
    // Local/test convenience only. Production deployments must build during deployment.
    console.log('Dashboard build missing; building frontend before startup...');
    const { build } = await import('vite');
    await build({ root });
    if (!existsSync(builtIndex)) {
      console.error('Dashboard build failed; dist/index.html was not created.');
      process.exit(1);
    }
  }
  app.use(express.static(path.join(root, 'dist')));
  app.get('*', (_req, res) => res.sendFile(builtIndex));
}
const portFlagIndex = process.argv.indexOf('--port');
const portArg = process.argv.find((value) => value.startsWith('--port='))?.split('=')[1] || (portFlagIndex >= 0 ? process.argv[portFlagIndex + 1] : undefined);
const port = Number(process.env.PORT || portArg || 3000);
app.listen(port, process.env.HOST || '0.0.0.0', () => console.log(`Admin server running at http://localhost:${port}`));
