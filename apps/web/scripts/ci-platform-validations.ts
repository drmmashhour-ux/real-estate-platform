/**
 * Safe platform validations for CI: no destructive git/db operations.
 * - validate:flows only when DATABASE_URL (or CI_DATABASE_URL) is set and non-empty.
 * - Vitest unit suite unless CI_SKIP_VITEST=1.
 */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = join(__dirname, "..");

function run(cmd: string, args: string[], label: string): boolean {
  console.log(`[ci:validate:platform] ${label}: ${cmd} ${args.join(" ")}`);
  const r = spawnSync(cmd, args, {
    cwd: WEB_ROOT,
    stdio: "inherit",
    env: { ...process.env },
    shell: process.platform === "win32",
  });
  if (r.status !== 0) {
    console.error(`[ci:validate:platform] FAILED: ${label}`);
    return false;
  }
  return true;
}

async function main(): Promise<void> {
  const dbUrl = (process.env.CI_DATABASE_URL || process.env.DATABASE_URL || "").trim();
  let flowsSkipped = false;

  if (dbUrl) {
    console.log("[ci:validate:platform] DATABASE_URL present — running validate:flows");
    if (!run("pnpm", ["exec", "tsx", "scripts/validate-core-flows.ts"], "validate:flows")) {
      process.exit(1);
    }
  } else {
    flowsSkipped = true;
    console.log(
      "[ci:validate:platform] SKIP validate:flows — no DATABASE_URL / CI_DATABASE_URL (expected in default GitHub Actions; set secret to enable).",
    );
  }

  if (process.env.CI_SKIP_VITEST === "1") {
    console.log("[ci:validate:platform] SKIP vitest — CI_SKIP_VITEST=1");
  } else {
    if (!run("pnpm", ["exec", "vitest", "run"], "vitest run")) {
      process.exit(1);
    }
  }

  if (!run("pnpm", ["exec", "tsx", "scripts/check-regulator-marketing-claims.ts"], "check-regulator-marketing-claims")) {
    process.exit(1);
  }

  if (typeof process.env.GITHUB_STEP_SUMMARY === "string" && process.env.GITHUB_STEP_SUMMARY) {
    const { appendFileSync } = await import("node:fs");
    const lines = [
      "## Platform validations",
      "",
      `- validate:flows: ${flowsSkipped ? "skipped (no DB URL)" : "passed"}`,
      `- vitest: ${process.env.CI_SKIP_VITEST === "1" ? "skipped" : "passed"}`,
      "",
    ];
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, lines.join("\n"));
  }

  console.log("[ci:validate:platform] DONE");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
