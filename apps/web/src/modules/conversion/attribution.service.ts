/**
 * Placeholder for multi-touch attribution — keep single-session metadata on EventLog rows.
 */
export type AttributionStub = { source?: string; campaign?: string };

export function mergeAttribution(meta: Record<string, unknown>, attr: AttributionStub): Record<string, unknown> {
  return { ...meta, ...attr };
}
