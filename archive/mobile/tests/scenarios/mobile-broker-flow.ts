/**
 * Mobile broker workflow — **service-level / static simulation** (no device automation in this repo by default).
 * For full automation, use Expo E2E or Maestro with a test broker account.
 */
import { existsSync } from "node:fs";
import { join } from "node:path";

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
  const root = join(__dirname, "..", "..");
  const criticalFiles = [
    "src/modules/broker-mobile/broker-mobile.service.ts",
    "src/app/broker/index.tsx",
    "src/services/apiClient.ts",
  ];
  const steps: MobileBrokerStep[] = [];
  for (const f of criticalFiles) {
    const path = join(root, f);
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
