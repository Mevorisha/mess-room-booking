import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import eslint from "vite-plugin-eslint";
import path from "path";
import fs from "fs";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    https: {
      key: fs.readFileSync("../backend/certificates/localhost-key.pem"),
      cert: fs.readFileSync("../backend/certificates/localhost.pem"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes("node_modules")) {
            return id.toString().split("node_modules/")[1].split("/")[0].toString();
          }
        },
      },
    },
  },
  plugins: [react(), eslint()],
});
