/**
 * Capture Playwright PNGs for App Store / Play at exact viewport sizes.
 * Requires dev server: `pnpm dev` (default http://127.0.0.1:3001) or set SCREENSHOT_BASE_URL.
 *
 * Writes to:
 *   public/marketing/screenshots/exports/iphone-1290x2796/
 *   public/marketing/screenshots/exports/android-1080x1920/
 */
import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

import {
  APP_STORE_SLIDES,
  EXPORT_DIMENSIONS,
  type ScreenshotPlatform,
} from "../lib/marketing/app-store-screenshots";

const __dirname = dirname(fileURLToPath(import.meta.url));
const webRoot = join(__dirname, "..");

const baseUrl = (process.env.SCREENSHOT_BASE_URL ?? "http://127.0.0.1:3001").replace(/\/$/, "");

async function capture(platform: ScreenshotPlatform, slug: string, outPath: string) {
  const dim = EXPORT_DIMENSIONS[platform];
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({
      viewport: { width: dim.width, height: dim.height },
      deviceScaleFactor: 1,
    });
    const url = `${baseUrl}/marketing/screenshots/export/${platform}/${slug}`;
    await page.goto(url, { waitUntil: "networkidle", timeout: 120_000 });
    await page.waitForSelector("#lecipm-store-export-root", { timeout: 30_000 });
    const el = page.locator("#lecipm-store-export-root");
    await el.screenshot({ path: outPath, type: "png" });
  } finally {
    await browser.close();
  }
}

const outIphone = join(webRoot, "public", "marketing", "screenshots", "exports", "iphone-1290x2796");
const outAndroid = join(webRoot, "public", "marketing", "screenshots", "exports", "android-1080x1920");

await mkdir(outIphone, { recursive: true });
await mkdir(outAndroid, { recursive: true });

for (const slide of APP_STORE_SLIDES) {
  const name = `screen-${slide.order}-${slide.slug}.png`;
  process.stdout.write(`iphone  ${slide.slug}… `);
  await capture("iphone", slide.slug, join(outIphone, name));
  console.log("ok");
  process.stdout.write(`android ${slide.slug}… `);
  await capture("android", slide.slug, join(outAndroid, name));
  console.log("ok");
}

console.log(`\nWrote exports under public/marketing/screenshots/exports/ (base URL: ${baseUrl})`);
