import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        root: "index.html",
        en: "en/index.html",
        ja: "ja/index.html",
        "zh-cn": "zh-cn/index.html",
      },
    },
  },
});
