import path from "node:path";
import { defineConfig, devices } from "@playwright/test";
import { config as loadEnv } from "dotenv";

loadEnv({ path: path.resolve(process.cwd(), ".env") });

/** Default port 3000 — use `pnpm dev:3000` or set PLAYWRIGHT_BASE_URL. */
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

const headed = process.env.PLAYWRIGHT_HEADED === "1" || process.env.PLAYWRIGHT_HEADLESS === "0";

export default defineConfig({
  testDir: path.join(process.cwd(), "tests/e2e"),
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 1,
  workers: 1,
  timeout: 180_000,
  reporter: [
    ["list"],
    ["json", { outputFile: path.join(process.cwd(), "tests/e2e/report/playwright-report.json") }],
  ],
  use: {
    baseURL,
    headless: !headed,
    navigationTimeout: 60_000,
    actionTimeout: 30_000,
    trace: "on-first-retry",
    video: "off",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
