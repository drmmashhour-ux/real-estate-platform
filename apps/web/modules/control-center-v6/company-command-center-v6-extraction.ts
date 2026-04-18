/**
 * Source-grounded extraction for V6 modes — no fabricated trends.
 */
import type { AiControlCenterPayload } from "@/modules/control-center/ai-control-center.types";
import type { CompanyCommandCenterV4Payload } from "@/modules/control-center-v4/company-command-center-v4.types";

export function winsFromDeltas(v4: CompanyCommandCenterV4Payload): string[] {
  const out: string[] = [];
  for (const d of v4.changesSinceYesterday.systems) {
    if (d.riskShift === "down" && d.changed) out.push(`${d.system}: ${d.summary}`);
  }
  return out.slice(0, 6);
}

export function regressionsFromDeltas(v4: CompanyCommandCenterV4Payload): string[] {
  const out: string[] = [];
  for (const d of v4.changesSinceYesterday.systems) {
    if (d.riskShift === "up" && d.changed) out.push(`${d.system}: ${d.summary}`);
  }
  return out.slice(0, 6);
}

export function healthCounts(v4: CompanyCommandCenterV4Payload): Record<string, string | number> {
  const es = v4.v3.shared.meta;
  return {
    systemsLoaded: es.systemsLoadedCount,
    overall: v4.v3.shared.overallStatus,
    partialData: es.partialData ? 1 : 0,
  };
}

export function boardMetricsFromKpis(v4: CompanyCommandCenterV4Payload): Record<string, string> {
  const o: Record<string, string> = {};
  for (const k of v4.v3.shared.quickKpis.slice(0, 12)) {
    o[k.label] = k.value;
  }
  return o;
}

export function evidenceFromMeta(v4: CompanyCommandCenterV4Payload, v1: AiControlCenterPayload | null): string[] {
  const lines: string[] = [];
  lines.push(`Sources used in aggregate: ${v4.v3.shared.meta.sourcesUsed.length ? v4.v3.shared.meta.sourcesUsed.join(", ") : "—"}`);
  if (v1) {
    lines.push(`V1 history rows available: ${v1.history.length}`);
  } else {
    lines.push("V1 history not merged (optional load failed or skipped).");
  }
  return lines;
}
