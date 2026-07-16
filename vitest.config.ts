import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Test infra owned by Claude (review/tests). App code in /app and /lib is owned by Codex.
export default defineConfig({
  esbuild: { jsx: "automatic" },
  resolve: {
    alias: { "@": fileURLToPath(new URL(".", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
