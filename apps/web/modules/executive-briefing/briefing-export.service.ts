import type { ExecutiveBriefingGeneratedSummary } from "./executive-briefing.types";

export function exportBriefingAsJson(summary: ExecutiveBriefingGeneratedSummary): string {
  return JSON.stringify(summary, null, 2);
}

export function exportBriefingAsMarkdown(summary: ExecutiveBriefingGeneratedSummary): string {
  const p = summary.payload;
  const lines: string[] = [`# Briefing exécutif`, ``, `_${summary.disclaimer}_`, ``];
  lines.push(`## Semaine`, `${p.weekRange.start} → ${p.weekRange.end}`, ``);
  lines.push(`## KPI`, ...p.kpiSnapshot.facts.map((f) => `- ${f}`), ``);
  lines.push(`## Améliorations`, ...p.improvements.facts.map((f) => `- ${f}`), ``);
  lines.push(`## Dégradations`, ...p.deteriorations.facts.map((f) => `- ${f}`), ``);
  lines.push(`## Conformité`, ...p.complianceRisk.facts.map((f) => `- ${f}`), ``);
  return lines.join("\n");
}
