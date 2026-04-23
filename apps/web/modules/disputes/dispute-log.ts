type DisputeLogKind = "dispute" | "resolution" | "conflict";

/**
 * Structured operator logging — aligns with audit search `[dispute]` style.
 * Server-side resolution already uses `recordAuditEvent`; this is for explicit traces.
 */
export function logDisputeRoom(kind: DisputeLogKind, message: string, meta?: Record<string, unknown>): void {
  const prefix =
    kind === "dispute" ? "[dispute]"
    : kind === "resolution" ? "[resolution]"
    : "[conflict]";
  if (process.env.NODE_ENV === "development") {
    console.info(prefix, message, meta ?? {});
  }
}
