import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    include: [
      "config/**/*.test.ts",
      "lib/**/*.test.ts",
      "app/api/**/*.test.ts",
      "modules/**/*.test.ts",
      "src/modules/**/*.test.ts",
      "components/**/*.test.ts",
      "components/**/*.test.tsx",
      "tests/**/*.test.ts",
      "services/**/*.test.ts",
    ],
    globals: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});
