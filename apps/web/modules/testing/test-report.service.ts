import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

import type { FinalValidationReport, TunnelTestResult } from "@/modules/testing/test-result.types";

const CRITICAL_TUNNEL_IDS = new Set([
  "bnhub-guest-booking",
  "payment-stripe",
  "broker-deal-flow",
  "security-access-control",
]);

export function buildFinalReport(results: TunnelTestResult[]): FinalValidationReport {
  const passed = results.filter((r) => r.status === "PASS").length;
  const failed = results.filter((r) => r.status === "FAIL").length;
  const warnings = results.filter((r) => r.status === "WARNING").length;

  const criticalFailures = results
    .filter((r) => r.critical && r.status === "FAIL")
    .map((r) => ({ id: r.id, name: r.name, errors: r.errors }));

  const blockedByCritical =
    criticalFailures.length > 0 ||
    results.some((r) => CRITICAL_TUNNEL_IDS.has(r.id) && r.status === "FAIL");

  const notes: string[] = [];
  if (blockedByCritical) {
    notes.push("NO_GO: one or more critical tunnels failed (booking, payment, broker, or security).");
  } else if (failed > 0) {
    notes.push("NO_GO: one or more tunnels failed — review before launch.");
  } else if (warnings > 0) {
    notes.push("GO with warnings: review WARNING tunnels (broker data, HTTP reachability, mobile) before launch.");
  } else {
    notes.push("GO: all tunnels passed.");
  }

  let recommendation: "GO" | "NO_GO" = "GO";
  if (blockedByCritical || failed > 0) {
    recommendation = "NO_GO";
  }

  return {
    generatedAt: new Date().toISOString(),
    totalTests: results.length,
    passed,
    failed,
    warnings,
    criticalFailures,
    results,
    recommendation,
    notes,
  };
}

/** Resolve repo-root `tests/reports/final-report.json` from apps/web cwd or env override. */
export function resolveReportPath(): string {
  const override = process.env.LECIPM_VALIDATION_REPORT_PATH?.trim();
  if (override) return override;
  return join(process.cwd(), "..", "..", "tests", "reports", "final-report.json");
}

export function writeFinalReportJson(report: FinalValidationReport, path = resolveReportPath()): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(report, null, 2), "utf8");
  console.info(`[validation] Wrote report: ${path}`);
}
