import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import dyadTagger from "@dyad-sh/react-vite-component-tagger";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    dyadTagger(),
    {
      name: "buildui-preview-inspector",
      apply: "serve",
      transformIndexHtml() {
        return [{ tag: "script", attrs: { type: "module", src: "/src/preview-inspector.js" }, injectTo: "body" }];
      },
    },
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
});
