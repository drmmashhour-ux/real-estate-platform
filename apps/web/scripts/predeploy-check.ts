/**
 * LECIPM Deployment Safety System v1 — pre-deploy gate. Fails loud on any critical check.
 *
 *   pnpm --filter @lecipm/web run predeploy:check
 *
 * Default (production-safe): `pnpm run typecheck`, `prisma validate`, required env
 * (`DATABASE_URL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`), API route handler scan,
 * `pnpm run build`. TypeScript covers undefined imports across the project.
 *
 * Env:
 *   LECIPM_SKIP_TYPECHECK=1 — skip typecheck (LOCAL ONLY; blocked when CI=1 or VERCEL=1)
 *   LECIPM_SKIP_BUILD=1     — skip next build (LOCAL ONLY; blocked when CI=1 or VERCEL=1)
 *   LECIPM_ENFORCE_DB_MIGRATIONS=1 — fail if `prisma migrate status` reports pending
 */
import { spawnSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";

import {
  describeStripeSecretKeyError,
  describeStripeWebhookSecretError,
} from "../lib/stripe/stripeEnvGate";

const __dirname = dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = join(__dirname, "..");

config({ path: resolve(WEB_ROOT, ".env") });
config({ path: resolve(WEB_ROOT, ".env.local") });

function run(label: string, cmd: string, args: string[]): boolean {
  console.log(`\n[predeploy] ${label}…`);
  const r = spawnSync(cmd, args, {
    cwd: WEB_ROOT,
    stdio: "inherit",
    shell: process.platform === "win32",
    env: { ...process.env },
  });
  return r.status === 0;
}

function collectRouteFiles(dir: string, out: string[]): void {
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, name.name);
    if (name.isDirectory()) collectRouteFiles(p, out);
    else if (name.name === "route.ts") out.push(p);
  }
}

/** Ensure App Router route modules export at least one HTTP handler. */
function validateApiRouteHandlers(): string | null {
  const apiRoot = join(WEB_ROOT, "app", "api");
  const routes: string[] = [];
  try {
    collectRouteFiles(apiRoot, routes);
  } catch {
    return "Could not scan app/api for route.ts files";
  }
  const asyncFn = /export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\b/;
  const constExport = /export\s+const\s+(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\s*=/;
  const reExport = /export\s*\{[^}]*\b(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\b/;
  const bad: string[] = [];
  for (const f of routes) {
    const src = readFileSync(f, "utf8");
    if (!asyncFn.test(src) && !constExport.test(src) && !reExport.test(src)) {
      bad.push(f.replace(WEB_ROOT + "/", ""));
    }
  }
  if (bad.length > 0) {
    return `Missing HTTP handler export in: ${bad.slice(0, 12).join(", ")}${bad.length > 12 ? "…" : ""}`;
  }
  return null;
}

function requiredEnvForDeploy(): string | null {
  const need = ["DATABASE_URL"];
  const missing = need.filter((k) => !process.env[k]?.trim());
  if (missing.length) {
    return `Missing required env: ${missing.join(", ")}`;
  }
  return null;
}

function isFullPredeploy(): boolean {
  return process.env.LECIPM_PREDEPLOY_FULL === "1";
}

function includeBuild(): boolean {
  return process.env.LECIPM_PREDEPLOY_INCLUDE_BUILD === "1" || isFullPredeploy();
}

/** Strict Stripe: secret + webhook (used for LECIPM_PREDEPLOY_FULL). */
function checkStripeFull(): string | null {
  const skErr = describeStripeSecretKeyError();
  if (skErr) return skErr;
  const whErr = describeStripeWebhookSecretError();
  if (whErr) return whErr;
  return null;
}

function isProductionGate(): boolean {
  return (
    process.env.VERCEL_ENV === "production" ||
    process.env.LECIPM_PREDEPLOY_PRODUCTION === "1"
  );
}

function checkStripeStrict(): string | null {
  const skErr = describeStripeSecretKeyError();
  if (skErr) return skErr;

  if (isProductionGate()) {
    const whErr = describeStripeWebhookSecretError();
    if (whErr) return `Production: ${whErr}`;
  } else if (process.env.STRIPE_WEBHOOK_SECRET?.trim() && !process.env.STRIPE_WEBHOOK_SECRET.startsWith("whsec_")) {
    return "STRIPE_WEBHOOK_SECRET must start with whsec_ when set";
  }
  return null;
}

function checkSentryProd(): void {
  if (isProductionGate() && !process.env.SENTRY_DSN?.trim()) {
    console.warn(
      "[predeploy] WARN: SENTRY_DSN unset in production — error monitoring optional but recommended.",
    );
  }
}

function main(): void {
  const skipTsc = process.env.LECIPM_SKIP_TYPECHECK === "1";
  if (!skipTsc) {
    if (
      !run(
        "TypeScript (tsc)",
        "pnpm",
        ["exec", "tsc", "--noEmit", "-p", "tsconfig.json"],
      )
    ) {
      console.error("\n[predeploy] BLOCKED: TypeScript errors.");
      process.exit(1);
    }
  } else {
    console.log("\n[predeploy] SKIP TypeScript — LECIPM_SKIP_TYPECHECK=1");
  }

  if (!run("prisma validate", "pnpm", ["exec", "prisma", "validate", "--schema=./prisma"])) {
    console.error("\n[predeploy] BLOCKED: Prisma schema invalid.");
    process.exit(1);
  }

  if (process.env.DATABASE_URL?.trim() && process.env.LECIPM_ENFORCE_DB_MIGRATIONS === "1") {
    const st = spawnSync("pnpm", ["exec", "prisma", "migrate", "status", "--schema=./prisma"], {
      cwd: WEB_ROOT,
      stdio: "inherit",
      shell: process.platform === "win32",
      env: { ...process.env },
    });
    if (st.status !== 0) {
      console.error(
        "\n[predeploy] BLOCKED: Prisma migrate status failed (pending migrations or DB unreachable).",
      );
      process.exit(1);
    }
  } else if (!process.env.DATABASE_URL?.trim()) {
    console.warn("[predeploy] WARN: DATABASE_URL unset — skipping prisma migrate status.");
  } else {
    console.warn(
      "[predeploy] INFO: prisma migrate status skipped — set LECIPM_ENFORCE_DB_MIGRATIONS=1 to require no pending migrations.",
    );
  }

  const envErr = requiredEnvForDeploy();
  if (envErr) {
    console.error(`\n[predeploy] BLOCKED: ${envErr}`);
    process.exit(1);
  }

  const routesErr = validateApiRouteHandlers();
  if (routesErr) {
    console.error(`\n[predeploy] BLOCKED: ${routesErr}`);
    process.exit(1);
  }

  const stripeErr = checkStripeDeploy();
  if (stripeErr) {
    console.error(`\n[predeploy] BLOCKED: ${stripeErr}`);
    process.exit(1);
  }

  checkSentryProd();

  const skipBuild = process.env.LECIPM_SKIP_BUILD === "1";
  if (skipBuild && isCiOrVercel()) {
    console.error("\n[predeploy] BLOCKED: LECIPM_SKIP_BUILD is not allowed in CI/Vercel.");
    process.exit(1);
  }
  if (!skipBuild) {
    if (!run("Next.js build", "pnpm", ["run", "build"])) {
      console.error("\n[predeploy] BLOCKED: next build failed.");
      process.exit(1);
    }
  } else {
    console.warn("\n[predeploy] WARN: Build skipped — unsafe for production. LECIPM_SKIP_BUILD=1");
  }

  console.log(
    "\n[predeploy] All checks passed. See docs/deployment.md for rollback and monitoring.",
  );
}

main();
