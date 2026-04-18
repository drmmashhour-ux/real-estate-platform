import type { AiControlCenterPayload } from "@/modules/control-center/ai-control-center.types";
import type { CompanyCommandCenterV4Payload } from "@/modules/control-center-v4/company-command-center-v4.types";
import type { CommandCenterAuditTrailEntry, CommandCenterTraceabilityNote } from "../company-command-center-v6.types";
import { digestToAuditSeverity } from "../control-center-v6-severity-mapper";
import { groupEntriesBySeverity, groupEntriesBySystem } from "../control-center-v6-traceability-mapper";

let seq = 0;
function id(prefix: string): string {
  seq += 1;
  return `${prefix}-${seq}`;
}

export function mapAuditTrailMode(
  v4: CompanyCommandCenterV4Payload,
  v1: AiControlCenterPayload | null,
): {
  mode: "audit_trail";
  summary: string;
  entries: CommandCenterAuditTrailEntry[];
  groupedBySystem: ReturnType<typeof groupEntriesBySystem>;
  groupedBySeverity: ReturnType<typeof groupEntriesBySeverity>;
  traceabilityNotes: CommandCenterTraceabilityNote[];
} {
  seq = 0;
  const entries: CommandCenterAuditTrailEntry[] = [];

  if (v1) {
    for (const h of v1.history.slice(0, 40)) {
      entries.push({
        id: id("hist"),
        source: "history",
        system: h.system,
        severity: "info",
        title: h.event,
        detail: h.note,
        provenance: `history@${h.ts}`,
      });
    }
  }

  for (const it of v4.anomalyDigest.items.slice(0, 30)) {
    entries.push({
      id: id("dig"),
      source: "digest",
      system: it.system,
      severity: digestToAuditSeverity(it.severity),
      title: it.title,
      detail: it.summary,
      provenance: "anomaly_digest",
    });
  }

  for (const d of v4.changesSinceYesterday.systems.filter((x) => x.changed).slice(0, 20)) {
    entries.push({
      id: id("delta"),
      source: "delta",
      system: d.system,
      severity: d.riskShift === "up" ? "warning" : "info",
      title: "Window delta",
      detail: d.summary,
      provenance: "changes_since_prior_window",
    });
  }

  const traceabilityNotes: CommandCenterTraceabilityNote[] = [
    { id: "t1", text: "Entries combine optional V1 history rows with V4 digest and delta syntheses." },
    { id: "t2", text: "When V1 history is empty, trail relies on digest/delta only — label as sparse." },
  ];

  const summary = v1?.history.length
    ? `Audit trail: ${entries.length} row(s) including ${v1.history.length} history row(s).`
    : `Audit trail: ${entries.length} row(s) — V1 history unavailable or empty; digest/delta only.`;

  return {
    mode: "audit_trail",
    summary,
    entries,
    groupedBySystem: groupEntriesBySystem(entries),
    groupedBySeverity: groupEntriesBySeverity(entries),
    traceabilityNotes,
  };
}
