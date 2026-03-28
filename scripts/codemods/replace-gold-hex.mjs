#!/usr/bin/env node
/**
 * Replace #D4AF37 / #d4af37 Tailwind arbitraries and common inline uses with theme tokens.
 * Skips: lib/email, contract PDF templates, canonical color token source files.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.join(process.cwd(), "apps/web");

const SKIP_SUBSTRINGS = [
  "/lib/email/",
  "/modules/contracts/services/templates/",
  "/lib/pdf/",
];
const SKIP_NAMES = new Set(["colors.ts", "lecipmDesignTokens.ts"]);
const SKIP_FILES = new Set([
  path.join(process.cwd(), "apps/web/lib/brand/platform.ts"),
  path.join(process.cwd(), "apps/web/config/branding.ts"),
]);

const COLOR_PREFIXES =
  "text|bg|border|ring|outline|divide|from|via|to|decoration|accent|caret|fill|stroke|shadow";

// (variants:)(prefix)-[#d4af37](/opacity)?
const CLASS_HEX = new RegExp(
  `((?:[\\w-]+:)*)(${COLOR_PREFIXES})-\\[#(?:[Dd]4[Aa][Ff]37)\\](\\/\\d+)?`,
  "g",
);

function shouldSkip(filePath) {
  const abs = path.resolve(filePath);
  if (SKIP_FILES.has(abs)) return true;
  const rel = filePath.replace(/\\/g, "/");
  for (const s of SKIP_SUBSTRINGS) {
    if (rel.includes(s)) return true;
  }
  if (SKIP_NAMES.has(path.basename(filePath))) return true;
  return false;
}

function* walk(dir) {
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    if (name.name.startsWith(".")) continue;
    const p = path.join(dir, name.name);
    if (name.isDirectory()) {
      if (name.name === "node_modules" || name.name === ".next") continue;
      yield* walk(p);
    } else if (/\.(tsx|ts|jsx|js)$/.test(name.name)) {
      yield p;
    }
  }
}

function transform(content) {
  let c = content;
  c = c.replace(CLASS_HEX, (_, variants, prefix, opacity) => `${variants}${prefix}-premium-gold${opacity ?? ""}`);

  // rgba(212, 175, 55, x) → rgb(var(--premium-gold-channels) / x)
  c = c.replace(/rgba\(\s*212\s*,\s*175\s*,\s*55\s*,\s*([\d.]+)\s*\)/g, "rgb(var(--premium-gold-channels) / $1)");
  c = c.replace(/rgba\(212,\s*175,\s*55,\s*([\d.]+)\)/g, "rgb(var(--premium-gold-channels) / $1)");

  // Inline style / object string literals (common patterns)
  c = c.replace(/'#(?:[Dd]4[Aa][Ff]37)'/g, "'var(--color-premium-gold)'");
  c = c.replace(/"#(?:[Dd]4[Aa][Ff]37)"/g, '"var(--color-premium-gold)"');

  // background: #D4AF37 (no quotes)
  c = c.replace(/background:\s*#(?:[Dd]4[Aa][Ff]37)\b/g, "background: var(--color-premium-gold)");
  c = c.replace(/backgroundColor:\s*#(?:[Dd]4[Aa][Ff]37)\b/g, "backgroundColor: 'var(--color-premium-gold)'");
  c = c.replace(/color:\s*#(?:[Dd]4[Aa][Ff]37)\b/g, "color: 'var(--color-premium-gold)'");
  c = c.replace(/borderColor:\s*#(?:[Dd]4[Aa][Ff]37)\b/g, "borderColor: 'var(--color-premium-gold)'");
  c = c.replace(/fill:\s*#(?:[Dd]4[Aa][Ff]37)\b/g, "fill: 'var(--color-premium-gold)'");
  c = c.replace(/stroke:\s*#(?:[Dd]4[Aa][Ff]37)\b/g, "stroke: 'var(--color-premium-gold)'");

  // Remaining bare hex in TS/JS (const GOLD = …, chart props) — use CSS variable string (SVG/React accept it)
  c = c.replace(/#(?:[Dd]4[Aa][Ff]37)\b/g, "var(--color-premium-gold)");

  return c;
}

let changed = 0;
for (const file of walk(ROOT)) {
  if (shouldSkip(file)) continue;
  const raw = fs.readFileSync(file, "utf8");
  if (!/#(?:[Dd]4[Aa][Ff]37)\b/.test(raw) && !/212\s*,\s*175\s*,\s*55/.test(raw)) continue;
  const next = transform(raw);
  if (next !== raw) {
    fs.writeFileSync(file, next, "utf8");
    changed++;
    console.log(file.replace(process.cwd() + "/", ""));
  }
}
console.error(`Updated ${changed} files.`);
