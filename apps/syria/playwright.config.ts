import path from "node:path";
import { config as loadDotenv } from "dotenv";
import { defineConfig, devices } from "@playwright/test";

/** Load apps/syria env so `DATABASE_URL` is set for `next dev` (required by `instrumentation.ts`). */
loadDotenv({ path: path.join(process.cwd(), ".env.local") });
loadDotenv({ path: path.join(process.cwd(), ".env") });

const port = process.env.PLAYWRIGHT_PORT ?? "3002";
const baseURL = `http://127.0.0.1:${port}`;

/**
 * Projects:
 * - **e2e** — smoke, APIs, redirects
 * - **visual** — screenshot baselines (`pnpm exec playwright test --project=visual --update-snapshots` once locally)
 * - **perf** — lightweight timing guards (`PERF_MS_MAX`, default 12s dev-friendly)
 *
 * Skip auto-start: `PLAYWRIGHT_SKIP_WEBSERVER=1 pnpm test:e2e`
 */
export default defineConfig({
  timeout: 30_000,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    headless: process.env.PLAYWRIGHT_HEADED !== "1",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: process.env.CI ? "retain-on-failure" : "off",
  },
  projects: [
    {
      name: "e2e",
      testDir: "./tests/e2e",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "visual",
      testDir: "./tests/visual",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "perf",
      testDir: "./tests/perf",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: process.env.PLAYWRIGHT_SKIP_WEBSERVER
    ? undefined
    : {
        command: "pnpm dev",
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
        stdout: "pipe",
        stderr: "pipe",
      },
});
