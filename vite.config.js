import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// mendooR — Vite + React
// Build-Output `dist/` wird vom Cloudflare Worker als statisches Asset
// ausgeliefert (siehe wrangler.jsonc → assets.directory).
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false
  },
  server: {
    // An alle Interfaces binden (IPv4 + IPv6) — so ist die App unter
    // localhost, 127.0.0.1 und (für Tests) der LAN-IP erreichbar.
    host: true,
    port: 5173,
    strictPort: true,
    // Im Dev-Betrieb laufen die /api/*-Aufrufe gegen `wrangler dev` (Port 8787),
    // damit dieselbe Worker-Logik wie in Produktion genutzt wird.
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true
      }
    }
  }
});
