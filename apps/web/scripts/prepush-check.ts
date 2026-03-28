/**
 * Manual pre-push gate (opt-in). Not installed as a git hook by default.
 *
 *   pnpm --filter @lecipm/web run prepush:check
 *
 * Env:
 *   PREPUSH_SKIP_BUILD=1  — skip production build (faster local checks)
 */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = join(__dirname, "..");

function run(label: string, cmd: string, args: string[]): boolean {
  console.log(`\n[prepush] ${label}…`);
  const r = spawnSync(cmd, args, {
    cwd: WEB_ROOT,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  return r.status === 0;
}

async function main(): Promise<void> {
  if (!run("integrity", "pnpm", ["run", "ci:integrity"])) process.exit(1);
  if (!run("typecheck", "pnpm", ["run", "ci:typecheck"])) process.exit(1);

  if (process.env.PREPUSH_SKIP_BUILD === "1") {
    console.log("\n[prepush] SKIP build — PREPUSH_SKIP_BUILD=1");
  } else {
    if (!run("build", "pnpm", ["run", "ci:build"])) process.exit(1);
  }

  console.log("\n[prepush] All requested checks passed.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
