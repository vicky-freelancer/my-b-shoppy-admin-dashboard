import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import { createAdminAuthRouter } from './admin-auth.mjs';
import express from 'express';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), {
      name: 'admin-auth',
      configureServer(server) {
        // Express registers these routes itself when Vite runs in middleware mode.
        if (server.config.server.middlewareMode) return;
        const auth = express();
        auth.disable('x-powered-by');
        auth.use(createAdminAuthRouter());
        auth.use('/api', (_req, res) => res.status(404).json({ error: 'Not found.' }));
        server.middlewares.use(auth);
      },
    }],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
