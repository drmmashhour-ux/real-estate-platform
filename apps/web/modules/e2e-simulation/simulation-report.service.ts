import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import type { UnifiedPlatformSimulationReport } from "./e2e-simulation.types";

/** Under `apps/web/tests/reports/` when cwd is apps/web */
export function resolveE2eReportJsonPath(): string {
  const override = process.env.LECIPM_E2E_SIMULATION_REPORT_PATH?.trim();
  if (override) return override;
  return join(process.cwd(), "tests", "reports", "final-e2e-report.json");
}

export function resolveE2eReportMdPath(): string {
  const json = resolveE2eReportJsonPath();
  return json.replace(/\.json$/i, ".md");
}

export function writeUnifiedSimulationReports(report: UnifiedPlatformSimulationReport): { jsonPath: string; mdPath: string } {
  const jsonPath = resolveE2eReportJsonPath();
  const mdPath = resolveE2eReportMdPath();
  mkdirSync(dirname(jsonPath), { recursive: true });
  writeFileSync(jsonPath, JSON.stringify(report, null, 2), "utf8");
  writeFileSync(mdPath, buildMarkdownReport(report), "utf8");
  console.info(`[e2e-simulation] Wrote ${jsonPath}`);
  console.info(`[e2e-simulation] Wrote ${mdPath}`);
  return { jsonPath, mdPath };
}

function buildMarkdownReport(r: UnifiedPlatformSimulationReport): string {
  const lines: string[] = [];
  lines.push(`# LECIPM Full Platform E2E Simulation`);
  lines.push("");
  lines.push(`- Version: ${r.version}`);
  lines.push(`- Generated: ${r.generatedAt}`);
  lines.push(`- Decision: **${r.decision}**`);
  lines.push(`- Base URL: ${r.context.baseUrl}`);
  lines.push("");

  for (const s of r.scenarios) {
    lines.push(`## ${s.scenarioName}`);
    lines.push("");
    lines.push(`- **Domain:** \`${s.domain}\``);
    lines.push(`- **Status:** ${s.status}`);
    lines.push(`- **Summary:** ${s.summary}`);
    lines.push("");
    lines.push("| Step | Status | Route / service | Evidence |");
    lines.push("|------|--------|-----------------|----------|");
    for (const st of s.steps) {
      const ev = st.evidence.replace(/\|/g, "\\|").slice(0, 120);
      lines.push(`| ${st.title} | ${st.status} | \`${st.routeOrService}\` | ${ev} |`);
    }
    lines.push("");
    if (s.recommendations.length) {
      lines.push("**Recommendations:**");
      for (const rec of s.recommendations) {
        lines.push(`- ${rec}`);
      }
      lines.push("");
    }
  }

  lines.push("## Critical blockers");
  lines.push("");
  for (const b of r.criticalBlockers) {
    lines.push(`- ${b}`);
  }
  lines.push("");
  lines.push("## Warnings");
  lines.push("");
  for (const w of r.warnings) {
    lines.push(`- ${w}`);
  }
  lines.push("");
  lines.push("## Recommended fixes (priority)");
  lines.push("");
  r.recommendedFixesPriority.forEach((x, i) => lines.push(`${i + 1}. ${x}`));
  lines.push("");
  return lines.join("\n");
}
