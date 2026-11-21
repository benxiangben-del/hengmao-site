import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { publicCatalog } from "./scripts/public-catalog.mjs";

export default defineConfig(({ command }) => ({
  base: "/",
  publicDir: command === "build" ? false : "public",
  plugins: [react(), publicCatalog()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        admin: resolve(__dirname, "admin.html"),
      },
    },
  },
}));
