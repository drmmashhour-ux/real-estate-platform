/**
 * Local / unified CI orchestration (deterministic order, loud failures).
 * Run from repo root: pnpm --filter @lecipm/web exec tsx scripts/ci-runner.ts
 * Or: pnpm run ci:all (from apps/web)
 */
import { appendFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = join(__dirname, "..");

type Step = { name: string; cmd: string; args: string[] };

const steps: Step[] = [
  { name: "integrity", cmd: "pnpm", args: ["run", "ci:integrity"] },
  { name: "typecheck", cmd: "pnpm", args: ["run", "ci:typecheck"] },
  { name: "build", cmd: "pnpm", args: ["run", "ci:build"] },
  { name: "validate:platform", cmd: "pnpm", args: ["run", "ci:validate:platform"] },
];

function appendSummary(line: string): void {
  const p = process.env.GITHUB_STEP_SUMMARY;
  if (p) appendFileSync(p, `${line}\n`);
}

function runStep(step: Step): boolean {
  console.log(`\n========== CI: ${step.name} ==========\n`);
  const r = spawnSync(step.cmd, step.args, {
    cwd: WEB_ROOT,
    stdio: "inherit",
    env: { ...process.env },
    shell: process.platform === "win32",
  });
  const ok = r.status === 0;
  appendSummary(`- **${step.name}**: ${ok ? "passed" : "FAILED"}`);
  return ok;
}

function printCiSummary(results: { name: string; ok: boolean }[]): void {
  console.log("\n========== CI SUMMARY ==========");
  for (const r of results) {
    console.log(`  [${r.ok ? "PASS" : "FAIL"}] ${r.name}`);
  }
  const allOk = results.every((r) => r.ok);
  appendSummary("");
  appendSummary(`### Overall: ${allOk ? "PASSED" : "FAILED"}`);

  if (!allOk) {
    console.error("\n[ci-runner] One or more steps failed.");
    process.exit(1);
  }
  console.log("\n[ci-runner] All steps passed.");
}

function main(): void {
  appendSummary("## LECIPM CI runner");
  appendSummary("");
  const results: { name: string; ok: boolean }[] = [];

  for (const step of steps) {
    const ok = runStep(step);
    results.push({ name: step.name, ok });
    if (!ok) {
      printCiSummary(results);
      process.exit(1);
    }
  }

  printCiSummary(results);
}

main();
