/**
 * Full pre-launch gate: env, assets, production build, /api/ready on prod server, E2E (production mode).
 *
 * Usage: pnpm prelaunch:check
 * Optional:
 *   SKIP_E2E=1 — skip Playwright
 *   LECIPM_PRELAUNCH_ENV_RELAX=1 — env check without --strict (local DB URLs ok)
 */
import { spawn, spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const webRoot = resolve(root, "apps/web");

function run(label: string, command: string, args: string[], cwd: string, env?: NodeJS.ProcessEnv): boolean {
  const r = spawnSync(command, args, {
    cwd,
    stdio: "inherit",
    shell: process.platform === "win32",
    env: { ...process.env, ...env },
  });
  const ok = (r.status ?? 1) === 0;
  console.log(ok ? `\n✔ PASS — ${label}\n` : `\n❌ FAIL — ${label}\n`);
  return ok;
}

async function apiReadyProdServer(): Promise<boolean> {
  const port = 30199;
  const proc = spawn("pnpm", ["exec", "next", "start", "-H", "127.0.0.1", "-p", String(port)], {
    cwd: webRoot,
    stdio: "pipe",
    shell: process.platform === "win32",
    env: { ...process.env, NODE_ENV: "production", PORT: String(port) },
  });

  let ok = false;
  try {
    for (let i = 0; i < 90; i++) {
      await delay(1000);
      try {
        const res = await fetch(`http://127.0.0.1:${port}/api/ready`);
        const j = (await res.json()) as { ready?: boolean; db?: string };
        if (res.ok && j.ready === true) {
          ok = true;
          break;
        }
      } catch {
        /* server not up */
      }
    }
  } finally {
    proc.kill("SIGTERM");
    await delay(500);
    if (!proc.killed) {
      try {
        proc.kill("SIGKILL");
      } catch {
        /* ignore */
      }
    }
  }

  console.log(ok ? `\n✔ PASS — GET /api/ready (next start production)\n` : `\n❌ FAIL — GET /api/ready\n`);
  return ok;
}

async function main(): Promise<void> {
  console.log("[prelaunch-check] Starting full gate…\n");

  const steps: boolean[] = [];

  const envArgs =
    process.env.LECIPM_PRELAUNCH_ENV_RELAX === "1"
      ? ["scripts/check-env-production.ts"]
      : ["scripts/check-env-production.ts", "--strict"];
  steps.push(run("env validation", "npx", ["tsx", ...envArgs], root));
  steps.push(run("static assets", "npx", ["tsx", "scripts/check-assets.ts"], root));

  const nodeOpts = (process.env.NODE_OPTIONS ?? "").trim();
  const buildEnv = {
    ...process.env,
    NODE_OPTIONS: nodeOpts.includes("max-old-space-size")
      ? nodeOpts || "--max-old-space-size=8192"
      : [nodeOpts, "--max-old-space-size=8192"].filter(Boolean).join(" ").trim(),
  };
  steps.push(run("pnpm build:web", "pnpm", ["build:web"], root, buildEnv));

  steps.push(await apiReadyProdServer());

  if (!process.env.SKIP_E2E) {
    steps.push(
      run(
        "Playwright E2E (production server)",
        "pnpm",
        ["test:e2e"],
        root,
        {
          PLAYWRIGHT_PRODUCTION: "1",
          CI: process.env.CI ?? "",
        },
      ),
    );
  } else {
    console.log("\n✔ SKIP — E2E (SKIP_E2E=1)\n");
    steps.push(true);
  }

  const allOk = steps.every(Boolean);
  if (!allOk) {
    console.error("\n❌ prelaunch-check: one or more sections failed\n");
    process.exit(1);
  }
  console.log("\n✅ prelaunch-check: all sections passed\n");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
