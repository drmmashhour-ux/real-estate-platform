/** Operator-facing structured logs — not legal advice or admissibility guarantees. */

export type ComplianceLogKind =
  | "consent_granted"
  | "consent_revoked"
  | "disclosure_accepted"
  | "audit_event_logged";

export function complianceLog(kind: ComplianceLogKind, meta?: Record<string, unknown>): void {
  if (meta && Object.keys(meta).length > 0) {
    console.info("[compliance]", kind, meta);
  } else {
    console.info("[compliance]", kind);
  }
}
