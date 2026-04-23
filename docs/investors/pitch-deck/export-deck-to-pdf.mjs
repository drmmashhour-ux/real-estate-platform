#!/usr/bin/env node
/**
 * One-command PDF export for docs/investors/pitch-deck/lecipm-investor-deck.html
 * Usage: node export-deck-to-pdf.mjs [--strict]
 *
 * --strict : exit with code 1 if unresolved placeholders [#] or $[___] remain in HTML
 */

import { existsSync, readFileSync, statSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath, pathToFileURL } from "url";

import puppeteer from "puppeteer";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE_HTML = join(__dirname, "lecipm-investor-deck.html");
const OUTPUT_PDF = join(__dirname, "lecipm-investor-deck.pdf");

const MIN_PDF_BYTES = 8 * 1024;

/** KPI tiles still showing literal [#] */
const UNRESOLVED_KPI_NUM = /<div class="num">\s*\[#\]\s*<\/div>/;

function scanPlaceholders(htmlText) {
  const issues = [];
  const lines = htmlText.split(/\r?\n/);
  lines.forEach((line, idx) => {
    if (line.includes("[#]")) issues.push({ line: idx + 1, kind: "[#]" });
    if (line.includes("$[___]")) issues.push({ line: idx + 1, kind: "$[___]" });
  });
  return issues;
}

function strictPlaceholderFailure(htmlRaw) {
  if (htmlRaw.includes("$[___]")) return true;
  return UNRESOLVED_KPI_NUM.test(htmlRaw);
}

async function main() {
  const strict = process.argv.includes("--strict");

  if (!existsSync(SOURCE_HTML)) {
    console.error(`export-deck-to-pdf: missing source HTML:\n  ${SOURCE_HTML}`);
    process.exit(1);
  }

  const htmlRaw = readFileSync(SOURCE_HTML, "utf8");
  const hasBracketHash = htmlRaw.includes("[#]");
  const hasAsk = htmlRaw.includes("$[___]");
  const hasKpiTokens = UNRESOLVED_KPI_NUM.test(htmlRaw);

  if (hasBracketHash || hasAsk) {
    console.warn("");
    console.warn("export-deck-to-pdf: placeholder scan (informational):");
    if (hasKpiTokens) console.warn("  KPI tiles still use literal [#] in .num cells");
    else if (hasBracketHash) console.warn("  [#] appears in HTML (may be disclaimer copy only)");
    if (hasAsk) console.warn("  pattern: $[___] (Ask amount)");
    const detailed = scanPlaceholders(htmlRaw).slice(0, 40);
    for (const d of detailed) {
      console.warn(`  line ${d.line}: contains ${d.kind}`);
    }
    if (detailed.length >= 40) console.warn("  … (truncated)");
    console.warn("");
    console.warn("Replace traction KPIs and Ask $[___] before investor distribution.");
    console.warn("");
    if (strict && strictPlaceholderFailure(htmlRaw)) {
      console.error(
        "export-deck-to-pdf: aborting (--strict) — unresolved $[___] or KPI [#] tiles remain."
      );
      process.exit(1);
    }
  }

  const sourceUrl = pathToFileURL(SOURCE_HTML).href;

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
  } catch (e) {
    console.error("export-deck-to-pdf: failed to launch Chromium via Puppeteer:", e?.message ?? e);
    process.exit(1);
  }

  try {
    const page = await browser.newPage();

    await page.setViewport({
      width: 1280,
      height: 720,
      deviceScaleFactor: 2,
    });

    await page.emulateMediaType("print");

    await page.goto(sourceUrl, {
      waitUntil: "networkidle2",
      timeout: 120_000,
    });

    await page.evaluate(async () => {
      if (document.fonts?.ready) await document.fonts.ready;
    });

    await new Promise((r) => setTimeout(r, 600));

    const slideCount = await page.evaluate(() => document.querySelectorAll(".slide").length);
    if (slideCount < 10) {
      console.error(
        `export-deck-to-pdf: expected ≥10 slides (.slide count=${slideCount}); refusing to emit a suspicious PDF.`
      );
      process.exit(1);
    }

    const bgSample = await page.evaluate(() => {
      const body = document.body;
      const s = getComputedStyle(body);
      return { backgroundColor: s.backgroundColor };
    });
    if (!bgSample.backgroundColor || bgSample.backgroundColor === "rgba(0, 0, 0, 0)") {
      console.warn(
        "export-deck-to-pdf: warning — body background may not be opaque black; verify printBackground output."
      );
    }

    await page.pdf({
      path: OUTPUT_PDF,
      printBackground: true,
      preferCSSPageSize: true,
      landscape: true,
      margin: {
        top: "0px",
        right: "0px",
        bottom: "0px",
        left: "0px",
      },
    });

    const st = statSync(OUTPUT_PDF);
    if (!st.size || st.size < MIN_PDF_BYTES) {
      console.error(
        `export-deck-to-pdf: output PDF too small (${st?.size ?? 0} bytes); likely blank or truncated.`
      );
      process.exit(1);
    }

    console.log("export-deck-to-pdf: OK");
    console.log(`  PDF written: ${OUTPUT_PDF}`);
    console.log(`  (${(st.size / 1024).toFixed(1)} KB)`);
  } catch (e) {
    console.error("export-deck-to-pdf: failed:", e?.message ?? e);
    process.exit(1);
  } finally {
    try {
      if (browser) await browser.close();
    } catch {
      /* noop */
    }
  }
}

await main();
