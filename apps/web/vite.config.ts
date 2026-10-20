import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const vitePort = Number(process.env.FELLES_VITE_PORT ?? 5173);
const apiPort = Number(process.env.FELLES_PORT ?? 3000);

export default defineConfig({
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    port: vitePort,
    strictPort: true,
    proxy: { "/api": { target: `http://127.0.0.1:${apiPort}`, changeOrigin: false } },
  },
  build: { outDir: "dist", sourcemap: false, assetsInlineLimit: 0 },
});
