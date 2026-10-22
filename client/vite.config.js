import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In development, /api and /health requests are proxied to the Express API
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:4000',
      '/health': 'http://localhost:4000',
    },
  },
});
