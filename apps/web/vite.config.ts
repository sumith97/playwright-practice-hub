import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The SPA proxies everything that belongs to the practice API, so tests and
// learners can always use same-origin URLs relative to the web app.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': 'http://127.0.0.1:3001',
      '/auth': 'http://127.0.0.1:3001',
      '/sse': 'http://127.0.0.1:3001',
      '/ws': { target: 'ws://127.0.0.1:3001', ws: true },
    },
  },
});
