import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { convexTestProviderPlugin } from "feather-testing-convex/vitest-plugin";
import path from "path";

export default defineConfig({
  plugins: [react(), convexTestProviderPlugin()],
  resolve: {
    alias: {
      "~": __dirname,
      "@": path.resolve(__dirname, "./src"),
      "@cvx": path.resolve(__dirname, "./convex"),
    },
  },
  test: {
    environment: "jsdom",
    environmentMatchGlobs: [["convex/**", "edge-runtime"]],
    server: { deps: { inline: ["convex-test"] } },
    globals: true,
    setupFiles: ["./src/test-setup.ts"],
  },
});
