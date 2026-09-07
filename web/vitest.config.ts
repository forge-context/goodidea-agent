import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // The shared studio sits outside this package's root, so it has to be listed for
  // the automatic JSX runtime to reach it.
  plugins: [react({ include: [/\.[jt]sx?$/] })],
  // The shared studio lives above this package, so it has to be pointed at the same
  // React the app builds against rather than resolving from its own directory.
  resolve: {
    dedupe: ["react", "react-dom"],
    alias: {
      react: fileURLToPath(new URL("./node_modules/react", import.meta.url)),
      "react-dom": fileURLToPath(new URL("./node_modules/react-dom", import.meta.url)),
    },
  },
  // The shared studio sits outside this package, where the plugin's own transform
  // does not reach; esbuild still has to be told to use the automatic JSX runtime.
  esbuild: { jsx: "automatic" },
  test: {
    // Only the demo component needs a DOM, and it asks for one with a docblock; the
    // storyboard and the playback machine are plain data and run without one.
    environment: "node",
  },
});
