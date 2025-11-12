import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

// Xử lý __dirname trong ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [react()],
  root: path.resolve(__dirname, "client"), // thư mục code chính
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client/src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets"),
    },
  },
  build: {
    outDir: path.resolve(__dirname, "dist"), // output Vercel build
    emptyOutDir: true,
  },
  server: {
    proxy: {
      "/api": {
        target: "https://796f2db4-7848-49ea-8b2b-4c67f6de26d7-00-248bpbd8f87mj.sisko.replit.dev",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
  base: "/", // 🔥 Bắt buộc có để Vercel định tuyến đúng SPA
});
