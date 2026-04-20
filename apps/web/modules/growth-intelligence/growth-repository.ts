/**
 * Persistence via existing GrowthOpportunityCandidate — avoids new tables when possible.
 */

import { prisma } from "@/lib/db";
import type { GrowthContentBrief } from "./growth-content-brief.service";
import type { GrowthOpportunity } from "./growth.types";
import type { GrowthSignal } from "./growth.types";

const PREFIX_OPPORTUNITY = "growth_intel_opportunity";
const PREFIX_BRIEF = "growth_intel_brief";
const PREFIX_SIGNAL_SNAPSHOT = "growth_intel_signal_snapshot";

export async function persistGrowthSignalSnapshot(signals: GrowthSignal[], snapshotId: string): Promise<{ ok: boolean; id: string | null }> {
  try {
    const row = await prisma.growthOpportunityCandidate.create({
      data: {
        type: PREFIX_SIGNAL_SNAPSHOT,
        targetType: "snapshot",
        targetId: snapshotId.slice(0, 40),
        score: 0,
        reason: "growth_signal_snapshot",
        metadataJson: { snapshotId, count: signals.length } as object,
        status: "pending",
      },
    });
    return { ok: true, id: row.id };
  } catch {
    return { ok: false, id: null };
  }
}

export async function persistGrowthOpportunityRecord(opportunity: GrowthOpportunity): Promise<{ ok: boolean; id: string | null }> {
  try {
    const row = await prisma.growthOpportunityCandidate.create({
      data: {
        type: PREFIX_OPPORTUNITY,
        targetType: opportunity.entityType.slice(0, 32),
        targetId: (opportunity.entityId ?? opportunity.id).slice(0, 40),
        score: 0,
        reason: opportunity.title.slice(0, 2000),
        metadataJson: {
          id: opportunity.id,
          opportunityType: opportunity.opportunityType,
          severity: opportunity.severity,
          title: opportunity.title,
          explanation: opportunity.explanation,
          entityType: opportunity.entityType,
          entityId: opportunity.entityId,
          region: opportunity.region,
          signalIds: opportunity.signalIds,
          metadata: opportunity.metadata,
        } as object,
        status: "pending",
      },
    });
    return { ok: true, id: row.id };
  } catch {
    return { ok: false, id: null };
  }
}

export async function persistGrowthBriefRecord(params: {
  opportunityId: string;
  brief: GrowthContentBrief;
}): Promise<{ ok: boolean; id: string | null }> {
  try {
    const row = await prisma.growthOpportunityCandidate.create({
      data: {
        type: PREFIX_BRIEF,
        targetType: "brief",
        targetId: params.opportunityId.slice(0, 40),
        score: 0,
        reason: params.brief.title.slice(0, 2000),
        metadataJson: params.brief as object,
        status: "pending",
      },
    });
    return { ok: true, id: row.id };
  } catch {
    return { ok: false, id: null };
  }
}

export async function listRecentGrowthOpportunities(take: number): Promise<GrowthOpportunity[]> {
  try {
    const rows = await prisma.growthOpportunityCandidate.findMany({
      where: { type: PREFIX_OPPORTUNITY },
      orderBy: { createdAt: "desc" },
      take,
    });
    return rows
      .map((r) => {
        const m = r.metadataJson as Partial<GrowthOpportunity> | null;
        if (!m?.id || !m.title) return null;
        return {
          ...m,
          locale: m.locale ?? "en",
          country: m.country ?? "ca",
          createdAt: m.createdAt ?? r.createdAt.toISOString(),
          signalIds: Array.isArray(m.signalIds) ? m.signalIds : [],
          metadata: (m.metadata as Record<string, unknown>) ?? {},
        } as GrowthOpportunity;
      })
      .filter((x): x is GrowthOpportunity => x != null);
  } catch {
    return [];
  }
}

export async function listRecentGrowthBriefs(take: number): Promise<Array<{ id: string; brief: GrowthContentBrief; createdAt: Date }>> {
  try {
    const rows = await prisma.growthOpportunityCandidate.findMany({
      where: { type: PREFIX_BRIEF },
      orderBy: { createdAt: "desc" },
      take,
    });
    return rows.map((r) => ({
      id: r.id,
      brief: r.metadataJson as GrowthContentBrief,
      createdAt: r.createdAt,
    }));
  } catch {
    return [];
  }
}

export async function markGrowthOpportunityReviewed(candidateId: string): Promise<{ ok: boolean }> {
  try {
    await prisma.growthOpportunityCandidate.update({
      where: { id: candidateId },
      data: { status: "reviewed", executedAt: new Date() },
    });
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
