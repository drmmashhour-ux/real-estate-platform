/**
 * Write JSON + Markdown reports under `tests/reports/`.
 */
import { mkdirSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import type { PlatformValidationReportV1 } from "./types";

export function getReportsDir(): string {
  return join(process.cwd(), "tests", "reports");
}

export function writeValidationReports(report: PlatformValidationReportV1): { jsonPath: string; mdPath: string } {
  const dir = getReportsDir();
  mkdirSync(dir, { recursive: true });
  const jsonPath = join(dir, "final-validation-report.json");
  const mdPath = join(dir, "final-validation-report.md");

  writeFileSync(jsonPath, JSON.stringify(report, null, 2), "utf8");

  const md = renderMarkdown(report);
  writeFileSync(mdPath, md, "utf8");

  return { jsonPath, mdPath };
}

function renderMarkdown(r: PlatformValidationReportV1): string {
  const lines: string[] = [];
  lines.push(`# LECIPM Full Platform Validation Report`);
  lines.push(``);
  lines.push(`- **Generated:** ${r.meta.generatedAt}`);
  lines.push(`- **Base URL:** ${r.meta.baseUrl}`);
  lines.push(`- **Mode:** ${r.meta.mode}`);
  lines.push(`- **Decision:** **${r.launch.decision}**`);
  lines.push(``);
  lines.push(`## Evidence`);
  lines.push(r.meta.evidenceNote);
  lines.push(``);

  lines.push(`## Launch events`);
  lines.push(`- ran: ${r.launchEvents.ran}`);
  lines.push(`- ready: ${r.launchEvents.ready}`);
  lines.push(`\`\`\`json`);
  lines.push(JSON.stringify(r.launchEvents.counts, null, 2));
  lines.push(`\`\`\``);
  if (r.launchEvents.issues.length) {
    lines.push(`Issues:`);
    for (const i of r.launchEvents.issues) lines.push(`- ${i}`);
  }
  lines.push(``);

  lines.push(`## Pages (${r.pages.length})`);
  for (const p of r.pages) {
    lines.push(`- \`${p.status}\` ${p.route} ${p.httpStatus ?? ""} ${p.errors.join("; ") || ""}`);
  }
  lines.push(``);

  lines.push(`## APIs (${r.apis.length})`);
  for (const a of r.apis) {
    lines.push(`- \`${a.status}\` ${a.name} ${a.httpStatus} ${a.errors.join("; ") || ""}`);
  }
  lines.push(``);

  lines.push(`## Security (${r.security.length})`);
  for (const s of r.security) {
    lines.push(`- \`${s.status}\` ${s.name} ${s.errors.join("; ") || ""}`);
  }
  lines.push(``);

  lines.push(`## Scenarios (${r.scenarios.length})`);
  for (const sc of r.scenarios) {
    lines.push(`### ${sc.label} (${sc.status})`);
    for (const st of sc.steps) {
      lines.push(`- ${st.ok ? "OK" : "FAIL"} ${st.name}${st.detail ? `: ${st.detail}` : ""}`);
    }
  }
  lines.push(``);

  lines.push(`## Stripe / booking E2E`);
  lines.push(`- ran: ${r.stripeBooking.ran}, ok: ${r.stripeBooking.ok}`);
  if (r.stripeBooking.detail) lines.push(`- detail: ${r.stripeBooking.detail}`);
  lines.push(``);

  lines.push(`## Data integrity`);
  lines.push(`- ran: ${r.dataIntegrity.ran}, ok: ${r.dataIntegrity.ok}`);
  for (const i of r.dataIntegrity.issues) lines.push(`- ${i}`);
  lines.push(``);

  lines.push(`## Blockers`);
  for (const b of r.launch.blockers) lines.push(`- ${b}`);
  lines.push(``);

  lines.push(`## Warnings`);
  for (const w of r.launch.warnings) lines.push(`- ${w}`);
  lines.push(``);

  return lines.join("\n");
}
