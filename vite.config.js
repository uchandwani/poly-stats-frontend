// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(() => {
  const server = {
    host: "0.0.0.0",
    port: 3001,
    strictPort: true,
    proxy: {
      // Dev proxy to your backend (which serves /api/...)
      "/api": { target: "http://localhost:5002", changeOrigin: true },
    },
  };

  // If you use ngrok, uncomment and set your current hostname:
  // server.hmr = { host: "141ebbaadb91.ngrok-free.app", protocol: "wss" };

  return {
    plugins: [react()],
    server,
    build: {
      sourcemap: true, // lets console stacks map to real files/lines
      rollupOptions: {
        // single bundle while debugging; remove later for code-splitting
        output: { manualChunks: undefined },
      },
    },
  };
});
