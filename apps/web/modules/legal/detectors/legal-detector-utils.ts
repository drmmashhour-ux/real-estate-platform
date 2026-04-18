import type { LegalIntelligenceSeverity } from "../legal-intelligence.types";

export function normalizeFileKey(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, "_");
}

export function stableSignalId(parts: string[]): string {
  return parts.join("|").slice(0, 200);
}

export function severityRank(s: LegalIntelligenceSeverity): number {
  if (s === "critical") return 3;
  if (s === "warning") return 2;
  return 1;
}
