import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  base: '/same/',
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname || ".", "./src")
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: true
  }
});
