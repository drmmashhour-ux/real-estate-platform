/**
 * Platform Core V2 — cross-decision conflict detection (same-entity collisions, resource competition, contradictory signals).
 */
import { platformCoreFlags } from "@/config/feature-flags";
import { PLATFORM_CORE_AUDIT } from "./platform-core.constants";
import { createAuditEvent, getDecisionById, updateDecisionStatus } from "./platform-core.repository";
import type { CoreDecisionRecord } from "./platform-core.types";
export type CoreConflictFinding = {
  decisionIds: [string, string];
  kind: "ENTITY_ACTION" | "RESOURCE_COMPETITION" | "CONTRADICTORY_SIGNAL";
  detail: string;
};

const SCALE_RE = /\b(scale|scaling|ramp up|increase budget|boost spend|expand)\b/i;
const PAUSE_RE = /\b(pause|stop|halt|cut budget|reduce spend|downscale)\b/i;

function contradictoryTrust(a: CoreDecisionRecord, b: CoreDecisionRecord): boolean {
  const ma = a.metadata && typeof a.metadata === "object" ? (a.metadata as Record<string, unknown>) : {};
  const mb = b.metadata && typeof b.metadata === "object" ? (b.metadata as Record<string, unknown>) : {};
  const ta = typeof ma.trustScore === "number" ? ma.trustScore : null;
  const tb = typeof mb.trustScore === "number" ? mb.trustScore : null;
  if (ta === null || tb === null) return false;
  return Math.abs(ta - tb) >= 0.35 && ta >= 0.55 && tb >= 0.55;
}

/**
 * Pairwise scan — bounded O(n²); intended for dashboard-sized batches.
 */
export function detectCoreConflicts(decisions: CoreDecisionRecord[]): CoreConflictFinding[] {
  const out: CoreConflictFinding[] = [];
  const n = decisions.length;
  for (let i = 0; i < n; i += 1) {
    for (let j = i + 1; j < n; j += 1) {
      const a = decisions[i]!;
      const b = decisions[j]!;
      const ha = `${a.actionType} ${a.title} ${a.summary}`;
      const hb = `${b.actionType} ${b.title} ${b.summary}`;

      if (a.entityId && a.entityId === b.entityId && a.entityType === b.entityType) {
        const scalePause = (SCALE_RE.test(ha) && PAUSE_RE.test(hb)) || (SCALE_RE.test(hb) && PAUSE_RE.test(ha));
        if (scalePause) {
          out.push({
            decisionIds: [a.id, b.id],
            kind: "ENTITY_ACTION",
            detail: "Conflicting scale vs pause style actions on the same entity.",
          });
        }
        if (contradictoryTrust(a, b)) {
          out.push({
            decisionIds: [a.id, b.id],
            kind: "CONTRADICTORY_SIGNAL",
            detail: "Strong trust scores diverge on the same entity — review evidence alignment.",
          });
        }
      }

      if (
        a.source === "ADS" &&
        b.source === "ADS" &&
        a.entityId &&
        a.entityId === b.entityId &&
        /budget|spend|bid/i.test(ha) &&
        /budget|spend|bid/i.test(hb)
      ) {
        out.push({
          decisionIds: [a.id, b.id],
          kind: "RESOURCE_COMPETITION",
          detail: "Multiple ads budget motions on the same entity — possible capacity contention.",
        });
      }
    }
  }

  const seen = new Set<string>();
  const deduped: CoreConflictFinding[] = [];
  for (const c of out) {
    const k = [c.decisionIds[0], c.decisionIds[1], c.kind].sort().join(":");
    if (seen.has(k)) continue;
    seen.add(k);
    deduped.push(c);
  }
  return deduped;
}

/**
 * Marks participating decisions in metadata and writes audit rows (no execution).
 * Gated by `FEATURE_PLATFORM_CORE_DEPENDENCIES_V1` (same rollout as dependency graph / orchestration edges).
 */
export async function markConflictedDecisions(findings: CoreConflictFinding[]): Promise<void> {
  if (!platformCoreFlags.platformCoreV1 || !platformCoreFlags.platformCoreDependenciesV1) {
    return;
  }
  const touched = new Set<string>();
  for (const f of findings) {
    for (const id of f.decisionIds) {
      if (touched.has(id)) continue;
      touched.add(id);
      const d = await getDecisionById(id);
      if (!d) continue;
      const prev = d.metadata && typeof d.metadata === "object" ? (d.metadata as Record<string, unknown>) : {};
      await updateDecisionStatus(id, d.status, {
        mergeMetadata: true,
        metadata: {
          ...prev,
          coreConflict: true,
          coreConflictKind: f.kind,
          coreConflictDetail: f.detail,
          coreConflictPeerId: f.decisionIds.find((x) => x !== id) ?? null,
        },
        auditEventType: PLATFORM_CORE_AUDIT.DECISION_CONFLICT,
        auditMessage: `Conflict: ${f.kind} — ${f.detail}`,
        lifecycleReason: `conflict flagged (${f.kind})`,
      });
    }
  }
}
