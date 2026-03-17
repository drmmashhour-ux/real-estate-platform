import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.spec.ts", "src/**/*.integration.test.ts"],
    coverage: { provider: "v8", reporter: ["text", "json"], include: ["src/**/*.ts"], exclude: ["**/*.test.ts", "**/*.spec.ts", "src/index.ts"] },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
