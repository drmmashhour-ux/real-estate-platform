import type { CommandCenterAuditTrailEntry } from "./company-command-center-v6.types";

export function groupEntriesBySystem(entries: CommandCenterAuditTrailEntry[]): { key: string; label: string; entries: CommandCenterAuditTrailEntry[] }[] {
  const m = new Map<string, CommandCenterAuditTrailEntry[]>();
  for (const e of entries) {
    const k = e.system || "general";
    if (!m.has(k)) m.set(k, []);
    m.get(k)!.push(e);
  }
  return Array.from(m.entries()).map(([key, ents]) => ({
    key,
    label: key,
    entries: ents,
  }));
}

export function groupEntriesBySeverity(entries: CommandCenterAuditTrailEntry[]): { key: string; label: string; entries: CommandCenterAuditTrailEntry[] }[] {
  const order: CommandCenterAuditTrailEntry["severity"][] = ["critical", "warning", "watch", "info"];
  const m = new Map<string, CommandCenterAuditTrailEntry[]>();
  for (const e of entries) {
    if (!m.has(e.severity)) m.set(e.severity, []);
    m.get(e.severity)!.push(e);
  }
  return order
    .filter((sev) => m.has(sev))
    .map((sev) => ({
      key: sev,
      label: sev,
      entries: m.get(sev)!,
    }));
}
