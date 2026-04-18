/**
 * LECIPM PLATFORM — read stored before/after metric windows from Platform Core decision metadata only.
 */

export type PlatformDecisionLite = {
  id: string;
  source: string;
  entityType: string;
  entityId: string | null;
  actionType: string;
  metadata: unknown;
};

export function readBeforeAfterFromMetadata(metadata: unknown): {
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
} {
  const m =
    metadata && typeof metadata === "object" && !Array.isArray(metadata) ?
      (metadata as Record<string, unknown>)
    : null;
  if (!m) return { before: null, after: null };

  const b = m.beforeMetrics ?? m.metricsBefore;
  const a = m.afterMetrics ?? m.metricsAfter;

  const before =
    b && typeof b === "object" && !Array.isArray(b) ? (b as Record<string, unknown>) : null;
  const after =
    a && typeof a === "object" && !Array.isArray(a) ? (a as Record<string, unknown>) : null;

  return { before, after };
}
