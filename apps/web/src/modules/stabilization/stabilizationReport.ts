import { writeFileSync } from "node:fs";
import { join } from "node:path";
import type { AuditResult, Severity, StabilizationIssue, StabilizationReport } from "./types";
import { runImportAudit } from "./importAudit";
import { runRouteAudit } from "./routeAudit";
import { runFeatureFlagAudit } from "./featureFlagAudit";
import { runEnvAudit } from "./envAudit";
import { runApiAudit } from "./apiAudit";
import { runDataFlowAudit } from "./dataFlowAudit";
import { runUiAudit } from "./uiAudit";
import { runErrorAudit } from "./errorAudit";
import { runPerformanceAudit } from "./performanceAudit";
import { runSecurityAudit } from "./securityAudit";

function countBySeverity(issues: StabilizationIssue[]): Record<Severity, number> {
  const out: Record<Severity, number> = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
  for (const i of issues) {
    out[i.severity] += 1;
  }
  return out;
}

/** Unresolved local/workspace imports and CRITICAL-severity issues block production readiness. */
export function classifyProductionReadiness(
  audits: AuditResult[],
  flatIssues: StabilizationIssue[]
): { criticalCount: number; productionReady: boolean; reasons: string[] } {
  const critical = flatIssues.filter((i) => i.severity === "CRITICAL");
  const importAudit = audits.find((a) => a.name === "importAudit");
  const unresolved = Number(importAudit?.stats.unresolvedImports ?? 0);
  const reasons: string[] = [...critical.map((c) => `${c.code}: ${c.message}`)];
  if (unresolved > 0) {
    reasons.push(`IMPORT_UNRESOLVED: ${unresolved} unresolved import(s)`);
  }

  const criticalCount = critical.length + (unresolved > 0 ? 1 : 0);
  const productionReady = critical.length === 0 && unresolved === 0;
  return { criticalCount, productionReady, reasons };
}

export function runFullStabilization(webRoot: string): StabilizationReport {
  const audits: AuditResult[] = [
    runImportAudit(webRoot),
    runRouteAudit(webRoot),
    runFeatureFlagAudit(webRoot),
    runEnvAudit(webRoot),
    runApiAudit(webRoot),
    runDataFlowAudit(webRoot),
    runUiAudit(webRoot),
    runErrorAudit(webRoot),
    runPerformanceAudit(webRoot),
    runSecurityAudit(webRoot),
  ];

  const flat = audits.flatMap((a) => a.issues);
  const issuesBySeverity = countBySeverity(flat);
  const { criticalCount, productionReady, reasons } = classifyProductionReadiness(audits, flat);

  const report: StabilizationReport = {
    generatedAt: new Date().toISOString(),
    webRoot,
    audits,
    issuesBySeverity,
    criticalCount,
    productionReady,
  };
  if (!productionReady) report.readinessBlockers = reasons;
  return report;
}

export function writeStabilizationReportJson(webRoot: string, report: StabilizationReport): string {
  const outPath = join(webRoot, ".stabilization-report.json");
  writeFileSync(outPath, JSON.stringify(report, null, 2), "utf8");
  return outPath;
}

export function printConsoleSummary(report: StabilizationReport): void {
  console.log("\n========== LECIPM STABILIZATION SUMMARY ==========\n");
  console.log(`Generated: ${report.generatedAt}`);
  console.log(`Web root:  ${report.webRoot}`);
  console.log("\nIssues by severity:", report.issuesBySeverity);
  console.log(`Critical (incl. import gate): ${report.criticalCount}`);
  for (const a of report.audits) {
    if (a.issues.length === 0) {
      console.log(`  [OK] ${a.name}  stats=${JSON.stringify(a.stats)}`);
    } else {
      console.log(`  [!!] ${a.name}  ${a.issues.length} issue(s)  stats=${JSON.stringify(a.stats)}`);
      for (const i of a.issues.slice(0, 8)) {
        console.log(`       - [${i.severity}] ${i.code}: ${i.message}${i.file ? ` (${i.file})` : ""}`);
      }
      if (a.issues.length > 8) console.log(`       ... +${a.issues.length - 8} more`);
    }
  }
  console.log("");
}
