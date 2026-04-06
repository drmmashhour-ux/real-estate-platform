/* eslint-disable @typescript-eslint/no-require-imports */
const { defineConfig, devices } = require("@playwright/test");
const { config: loadEnv } = require("dotenv");
const { resolve } = require("node:path");

loadEnv({ path: resolve(__dirname, ".env") });

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3001";

const webServer = process.env.PLAYWRIGHT_SKIP_WEBSERVER
  ? undefined
  : process.env.PLAYWRIGHT_PRODUCTION === "1"
    ? {
        command: "pnpm exec next start -H 127.0.0.1 -p 3001",
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        cwd: __dirname,
        env: { ...process.env, NODE_ENV: "production" },
      }
    : {
        command: "pnpm exec next dev -p 3001 -H 127.0.0.1 --webpack",
        url: baseURL,
        reuseExistingServer: true,
        timeout: 180_000,
        cwd: __dirname,
        env: { ...process.env },
      };

module.exports = defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  /** Global per-test timeout (ms); individual describes may override. */
  timeout: 120_000,
  reporter: [["list"], ["json", { outputFile: "e2e-report/results.json" }]],
  use: {
    baseURL,
    navigationTimeout: 60_000,
    actionTimeout: 30_000,
    trace: "on-first-retry",
    video: "off",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer,
});
