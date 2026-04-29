/**
 * Mobile broker workflow — **service-level / static simulation** (no device automation).
 * Moved from archived `mobile/` package so `pnpm run simulate:platform` resolves cleanly.
 *
 * Full automation: Expo E2E or Maestro against a test broker account.
 */
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";

export type MobileBrokerStep = {
  stepId: string;
  title: string;
  status: "PASS" | "FAIL" | "WARNING" | "NOT_CONFIRMED";
  details: string;
  evidence: string;
};

export async function runMobileBrokerServiceSimulation(): Promise<{
  scenarioName: string;
  steps: MobileBrokerStep[];
  status: "PASS" | "WARNING" | "NOT_CONFIRMED" | "FAIL";
  summary: string;
}> {
  const monorepoRoot = resolve(process.cwd(), "../..");
  const criticalFiles = [
    "apps/mobile-broker/index.ts",
    "apps/mobile-broker/lib/api.ts",
    "apps/mobile-broker/lib/supabase.ts",
  ];
  const steps: MobileBrokerStep[] = [];
  for (const f of criticalFiles) {
    const path = join(monorepoRoot, f);
    const ok = existsSync(path);
    steps.push({
      stepId: `mb-${f}`,
      title: `Source present: ${f}`,
      status: ok ? "PASS" : "FAIL",
      details: ok ? "file exists" : "missing",
      evidence: path,
    });
  }
  steps.push({
    stepId: "mb-runtime",
    title: "Runtime broker mobile session + push inbox",
    status: "NOT_CONFIRMED",
    details: "Requires device/emulator or Expo E2E — not executed in Node simulation",
    evidence: "skipped",
  });
  const failed = steps.some((s) => s.status === "FAIL");
  return {
    scenarioName: "Mobile Broker Flow (service-level)",
    steps,
    status: failed ? "FAIL" : "NOT_CONFIRMED",
    summary: "Static file checks only; runtime NOT_CONFIRMED",
  };
}
