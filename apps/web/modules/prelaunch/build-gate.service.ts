/**
 * Phase 1 — prisma validate/generate, tsc, next build — capture real output.
 */
import { spawnSync } from "node:child_process";
import type { BuildStepResult } from "./final-launch-report.types";

function runStep(
  label: string,
  cmd: string,
  args: string[],
  cwd: string,
  extraEnv?: Record<string, string>,
): BuildStepResult {
  const t0 = Date.now();
  const r = spawnSync(cmd, args, {
    cwd,
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
    shell: process.platform === "win32",
    env: { ...process.env, ...extraEnv },
  });
  const durationMs = Date.now() - t0;
  const out = `${r.stdout ?? ""}${r.stderr ?? ""}`;
  const tail = out.length > 12000 ? out.slice(-12000) : out;
  const ok = r.status === 0;
  return {
    step: label,
    ok,
    durationMs,
    logTail: ok ? undefined : tail,
    severity: ok ? "info" : "blocking",
  };
}

export type BuildGateOptions = {
  cwd: string;
  skipTsc?: boolean;
  skipBuild?: boolean;
};

export function runBuildGate(opts: BuildGateOptions): { steps: BuildStepResult[]; blockingFailures: string[] } {
  const steps: BuildStepResult[] = [];
  const blockingFailures: string[] = [];

  const pnpm = process.platform === "win32" ? "pnpm.cmd" : "pnpm";

  steps.push(runStep("prisma_validate", pnpm, ["exec", "prisma", "validate", "--schema=./prisma"], opts.cwd));
  steps.push(runStep("prisma_generate", pnpm, ["exec", "prisma", "generate", "--schema=./prisma"], opts.cwd));

  if (!opts.skipTsc) {
    steps.push(
      runStep(
        "typescript_tsc",
        pnpm,
        ["exec", "tsc", "--noEmit", "-p", "tsconfig.json"],
        opts.cwd,
        { NODE_OPTIONS: "--max-old-space-size=8192" },
      ),
    );
  }

  if (!opts.skipBuild) {
    steps.push(runStep("next_build", pnpm, ["run", "build"], opts.cwd));
  }

  for (const s of steps) {
    if (!s.ok && s.severity === "blocking") {
      blockingFailures.push(`${s.step}:failed`);
    }
  }

  return { steps, blockingFailures };
}
