/**
 * Platform Core V2 — dependency edges between decisions (heuristic detection + persisted graph).
 */
import { prisma } from "@/lib/db";
import { isPlatformCoreAuditEffective, platformCoreFlags } from "@/config/feature-flags";
import { PLATFORM_CORE_AUDIT } from "./platform-core.constants";
import { createAuditEvent } from "./platform-core.repository";
import type { CoreDecisionDependency, CoreDecisionRecord } from "./platform-core.types";

function haystack(d: CoreDecisionRecord): string {
  return `${d.title} ${d.summary} ${d.actionType} ${d.reason}`.toLowerCase();
}

/**
 * Heuristic edges: e.g. CRO work often assumes traffic exists; retargeting assumes lead capture; scaling assumes profitability signals.
 */
export function detectDecisionDependencies(decisions: CoreDecisionRecord[]): CoreDecisionDependency[] {
  const out: CoreDecisionDependency[] = [];
  const byId = new Map(decisions.map((d) => [d.id, d]));

  for (const d of decisions) {
    const h = haystack(d);

    for (const other of decisions) {
      if (other.id === d.id) continue;

      const o = haystack(other);

      // CRO change depends on traffic improvement (ads / growth traffic).
      if (d.source === "CRO" && (other.source === "ADS" || other.source === "UNIFIED")) {
        if (/traffic|impression|reach|volume|scale/.test(o) || /variant|cta|funnel|conversion/.test(h)) {
          out.push({ decisionId: d.id, dependsOnDecisionId: other.id, type: "REQUIRES" });
        }
      }

      // Retargeting depends on lead capture / audience (CRO or ADS list building).
      if (d.source === "RETARGETING" && (other.source === "CRO" || other.source === "ADS")) {
        if (/lead|capture|audience|pixel|remarketing|email/.test(o) || /retarget|remarket/.test(h)) {
          out.push({ decisionId: d.id, dependsOnDecisionId: other.id, type: "REQUIRES" });
        }
      }

      // Scaling depends on profitability (PROFIT source or profit language).
      if (/scale|scaling|ramp|budget up|increase spend/i.test(h) && d.source === "ADS") {
        if (other.source === "PROFIT" || /profit|margin|roas|cpa|unit economics/i.test(o)) {
          out.push({ decisionId: d.id, dependsOnDecisionId: other.id, type: "REQUIRES" });
        }
      }

      // Same entity — soft RELATED link for coordination (not always a hard block).
      if (d.entityId && d.entityId === other.entityId && d.entityType === other.entityType) {
        if (d.source !== other.source) {
          out.push({ decisionId: d.id, dependsOnDecisionId: other.id, type: "RELATED" });
        }
      }
    }
  }

  // Dedupe
  const seen = new Set<string>();
  const deduped: CoreDecisionDependency[] = [];
  for (const e of out) {
    const k = `${e.decisionId}:${e.dependsOnDecisionId}:${e.type}`;
    if (seen.has(k) || !byId.has(e.decisionId) || !byId.has(e.dependsOnDecisionId)) continue;
    seen.add(k);
    deduped.push(e);
  }
  return deduped;
}

export async function registerDependencies(rows: CoreDecisionDependency[]): Promise<{ inserted: number }> {
  if (!platformCoreFlags.platformCoreV1 || !platformCoreFlags.platformCoreDependenciesV1) {
    return { inserted: 0 };
  }
  let inserted = 0;
  for (const r of rows) {
    const exists = await prisma.platformCoreDecisionDependency.findFirst({
      where: {
        decisionId: r.decisionId,
        dependsOnDecisionId: r.dependsOnDecisionId,
        type: r.type,
      },
    });
    if (exists) continue;
    await prisma.platformCoreDecisionDependency.create({
      data: {
        decisionId: r.decisionId,
        dependsOnDecisionId: r.dependsOnDecisionId,
        type: r.type,
      },
    });
    inserted += 1;
  }
  if (inserted > 0 && isPlatformCoreAuditEffective()) {
    await createAuditEvent({
      eventType: PLATFORM_CORE_AUDIT.DEPENDENCIES_REGISTERED,
      source: "UNIFIED",
      entityType: "UNKNOWN",
      entityId: null,
      message: `Registered ${inserted} dependency edge(s)`,
      metadata: { count: inserted },
    });
  }
  return { inserted };
}

export async function getDecisionDependencies(decisionId: string): Promise<{
  outgoing: CoreDecisionDependency[];
  incoming: CoreDecisionDependency[];
}> {
  const [outgoingRows, incomingRows] = await Promise.all([
    prisma.platformCoreDecisionDependency.findMany({ where: { decisionId } }),
    prisma.platformCoreDecisionDependency.findMany({ where: { dependsOnDecisionId: decisionId } }),
  ]);
  const map = (r: { decisionId: string; dependsOnDecisionId: string; type: string }): CoreDecisionDependency => ({
    decisionId: r.decisionId,
    dependsOnDecisionId: r.dependsOnDecisionId,
    type: r.type as CoreDecisionDependency["type"],
  });
  return { outgoing: outgoingRows.map(map), incoming: incomingRows.map(map) };
}
