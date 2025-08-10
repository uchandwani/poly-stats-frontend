// vite.config.js

// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';


export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3001,
    allowedHosts: ['localhost', '141ebbaadb91.ngrok-free.app'],
    proxy: {
      "/api": { target: "http://localhost:5002", changeOrigin: true },
      "/auth": { target: "http://localhost:5002", changeOrigin: true }
    }
  },
  // 👇 Add this
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  // 👇 History fallback to support deep links
  resolve: {
    alias: {
      // for cleaner imports if needed
    }
  },
  optimizeDeps: {},
  // 👇 Add this plugin or middleware
  // Required only for static builds, not during dev mode
});
