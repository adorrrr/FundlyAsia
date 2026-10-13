import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    // Local dev: forward /api to the PHP server (php -S 127.0.0.1:8080 -t backend/public) so cookies stay same-origin.
    proxy: { '/api': { target: 'http://127.0.0.1:8080' } },
    watch: {
      ignored: ['**/*.zip', '**/dist/**'],
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          motion: ['framer-motion'],
        },
      },
    },
  },
});
