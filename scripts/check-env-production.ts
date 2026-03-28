/**
 * Validate env vars expected for production / Vercel.
 * Loads apps/web/.env then repo root .env (non-destructive overlay).
 *
 * Usage:
 *   pnpm env:check              — warnings; exit 1 only if DATABASE_URL missing
 *   pnpm env:check -- --strict  — exit 1 on missing required, empty, or localhost in URLs
 */
import { config } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
config({ path: resolve(root, "apps/web/.env") });
config({ path: resolve(root, ".env") });

const REQUIRED = ["DATABASE_URL", "NEXT_PUBLIC_APP_URL", "NEXT_PUBLIC_ENV"] as const;

function val(key: string): string {
  return (process.env[key] ?? "").trim();
}

function hasLocalhost(s: string): boolean {
  return /localhost|127\.0\.0\.1|0\.0\.0\.0/i.test(s);
}

const strict = process.argv.includes("--strict");

let failed = false;
const warnings: string[] = [];

for (const key of REQUIRED) {
  const v = val(key);
  if (!v) {
    const msg = `${key} is missing or empty`;
    if (strict) {
      console.error(`❌ ${msg}`);
      failed = true;
    } else {
      warnings.push(`⚠ ${msg} (set before production deploy)`);
    }
    continue;
  }
  if ((key === "DATABASE_URL" || key === "NEXT_PUBLIC_APP_URL") && hasLocalhost(v)) {
    const msg = `${key} points to localhost / loopback — not valid for Vercel production`;
    if (strict) {
      console.error(`❌ ${msg}`);
      failed = true;
    } else {
      warnings.push(`⚠ ${msg}`);
    }
  }
}

if (val("NEXT_PUBLIC_ENV") && val("NEXT_PUBLIC_ENV").toLowerCase() !== "production" && strict) {
  console.warn(
    `⚠ NEXT_PUBLIC_ENV="${val("NEXT_PUBLIC_ENV")}" — expected "production" for prod deploy (warning only)`,
  );
}

for (const w of warnings) {
  console.warn(w);
}

if (!val("DATABASE_URL")) {
  console.error("❌ DATABASE_URL is required for local builds and /api/ready");
  process.exit(1);
}

if (failed) {
  process.exit(1);
}

console.log("✔ Env check passed" + (strict ? " (strict)" : " — use --strict before go-live audit"));
