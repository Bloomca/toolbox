import { resolve } from "node:path";

import { defineConfig } from "vite";

export default defineConfig({
  oxc: {
    jsx: {
      importSource: "veles",
    },
  },
  resolve: {
    alias: {
      "veles/jsx-dev-runtime": "veles/jsx-runtime",
    },
  },
  build: {
    rollupOptions: {
      input: {
        desktop: resolve(__dirname, "index.html"),
        sudoku: resolve(__dirname, "sudoku/index.html"),
        markdown: resolve(__dirname, "markdown/index.html"),
        spinny: resolve(__dirname, "spinny/index.html"),
      },
    },
  },
});
