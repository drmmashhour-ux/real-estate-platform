/**
 * Pre-launch gate: db:check, validate:flows, web build.
 */
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function run(label: string, command: string, args: string[]): boolean {
  const r = spawnSync(command, args, {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32",
    env: process.env,
  });
  const ok = (r.status ?? 1) === 0;
  if (!ok) {
    console.error(`\n[prelaunch] Failed: ${label}\n`);
  }
  return ok;
}

function main(): void {
  console.log("[prelaunch] Running checks…\n");

  const steps: [string, string, string[]][] = [
    ["db:check", "pnpm", ["db:check"]],
    ["validate:flows", "pnpm", ["validate:flows"]],
    ["build:web", "pnpm", ["build:web"]],
  ];

  for (const [label, cmd, args] of steps) {
    if (!run(label, cmd, args)) {
      console.log("\n❌ Fix issues before launch\n");
      process.exit(1);
      return;
    }
  }

  console.log("\n✅ Ready for launch\n");
  process.exit(0);
}

main();
