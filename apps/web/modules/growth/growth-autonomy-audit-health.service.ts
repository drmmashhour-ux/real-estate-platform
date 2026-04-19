/**
 * Audit-health gate — expansion blocked when execution evidence is incomplete or unreliable.
 */

import {
  aggregateExecutionStatsByActionKey,
  countExecutionRowsSince,
  sampleExplanationIntegrity,
} from "./growth-autonomy-expansion-evidence.repository";

export type GrowthAutonomyAuditHealthReport = {
  healthy: boolean;
  reasons: string[];
  rowCountWindow: number;
  distinctActionKeys: number;
  explanationIntegritySample: {
    sampled: number;
    withSubstantiveExplanation: number;
  };
};

/** Minimum audit volume before expansion evidence is trustworthy. */
function minAuditRowsForHealth(): number {
  const raw = process.env.GROWTH_AUTONOMY_AUDIT_HEALTH_MIN_ROWS;
  if (!raw) return 12;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n >= 5 ? Math.min(500, n) : 12;
}

export async function evaluateGrowthAutonomyAuditHealth(args: { since: Date }): Promise<GrowthAutonomyAuditHealthReport> {
  const reasons: string[] = [];
  try {
    const rowCountWindow = await countExecutionRowsSince({ since: args.since });
    const stats = await aggregateExecutionStatsByActionKey({ since: args.since });
    const distinctActionKeys = stats.length;

    if (rowCountWindow < minAuditRowsForHealth()) {
      reasons.push(`Audit trail below minimum rows (${rowCountWindow} < ${minAuditRowsForHealth()}) for this window.`);
    }
    if (distinctActionKeys < 1 && rowCountWindow >= minAuditRowsForHealth()) {
      reasons.push("No grouped action-key statistics — audit pipeline may be incomplete.");
    }

    const integrity = await sampleExplanationIntegrity({ since: args.since, take: 80 });
    if (integrity.sampled >= 8 && integrity.substantive / integrity.sampled < 0.85) {
      reasons.push("Explanation completeness on sampled audit rows is below threshold.");
    }

    const healthy = reasons.length === 0;
    return {
      healthy,
      reasons: healthy ? [] : reasons,
      rowCountWindow,
      distinctActionKeys,
      explanationIntegritySample: { sampled: integrity.sampled, withSubstantiveExplanation: integrity.substantive },
    };
  } catch {
    return {
      healthy: false,
      reasons: ["Audit health check failed — expansion is blocked."],
      rowCountWindow: 0,
      distinctActionKeys: 0,
      explanationIntegritySample: { sampled: 0, withSubstantiveExplanation: 0 },
    };
  }
}
