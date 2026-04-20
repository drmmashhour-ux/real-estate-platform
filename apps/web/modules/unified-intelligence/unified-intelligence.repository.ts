/**
 * Unified intelligence read repository — prefers canonical autonomy tables; read-only; no throws.
 */
import { prisma } from "@/lib/db";
import { engineFlags } from "@/config/feature-flags";

export type CanonicalRunWire = {
  id: string;
  createdAt: Date;
  dryRun: boolean;
  status: string;
  autonomyMode: string;
  actions: Array<{
    actionType: string;
    governanceDisposition: string | null;
    executionStatus: string;
  }>;
};

export async function getCanonicalRunsForListingTarget(listingId: string): Promise<{
  runs: CanonicalRunWire[];
  notes: string[];
}> {
  const notes: string[] = [];
  try {
    if (!engineFlags.autonomousMarketplaceV1) {
      notes.push("autonomous_marketplace_disabled");
      return { runs: [], notes };
    }
    const lid = typeof listingId === "string" ? listingId.trim() : "";
    if (!lid) {
      notes.push("listing_id_missing");
      return { runs: [], notes };
    }

    const rows = await prisma.autonomousMarketplaceRun.findMany({
      where: { targetType: "fsbo_listing", targetId: lid },
      orderBy: { createdAt: "desc" },
      take: 12,
      select: {
        id: true,
        createdAt: true,
        dryRun: true,
        status: true,
        autonomyMode: true,
        actions: {
          take: 24,
          orderBy: { createdAt: "desc" },
          select: {
            actionType: true,
            governanceDisposition: true,
            executionStatus: true,
          },
        },
      },
    });

    return {
      runs: rows.map((r) => ({
        id: r.id,
        createdAt: r.createdAt,
        dryRun: r.dryRun,
        status: r.status,
        autonomyMode: r.autonomyMode,
        actions: r.actions.map((a) => ({
          actionType: a.actionType,
          governanceDisposition: a.governanceDisposition,
          executionStatus: a.executionStatus,
        })),
      })),
      notes,
    };
  } catch {
    return { runs: [], notes: ["canonical_runs_query_failed"] };
  }
}

export async function listUnifiedRecentListingIds(limit: number): Promise<{ ids: string[]; notes: string[] }> {
  try {
    if (!engineFlags.autonomousMarketplaceV1) {
      return { ids: [], notes: ["autonomous_marketplace_disabled"] };
    }
    const rows = await prisma.autonomousMarketplaceRun.findMany({
      where: { targetType: "fsbo_listing", targetId: { not: null } },
      orderBy: { createdAt: "desc" },
      take: Math.min(500, Math.max(20, limit * 10)),
      select: { targetId: true },
    });
    const seen = new Set<string>();
    const ids: string[] = [];
    for (const r of rows) {
      const id = r.targetId;
      if (!id || seen.has(id)) continue;
      seen.add(id);
      ids.push(id);
      if (ids.length >= limit) break;
    }
    return { ids, notes: ids.length === 0 ? ["no_canonical_runs_found"] : [] };
  } catch {
    return { ids: [], notes: ["recent_ids_query_failed"] };
  }
}

/** Alias matching repository contract — canonical autonomy rows only. */
export async function getUnifiedListingReadModel(listingId: string) {
  return getCanonicalRunsForListingTarget(listingId);
}

export async function listUnifiedRecentItems(params: { limit?: number }) {
  return listUnifiedRecentListingIds(params.limit ?? 25);
}

/** Canonical runs slice for any entity kind — listings only populate `runs` in v1. */
export async function getUnifiedEntityReadModel(params: {
  entityType: string;
  entityId: string;
}): Promise<{ runs: CanonicalRunWire[]; notes: string[] }> {
  try {
    if (params.entityType === "listing") {
      return getCanonicalRunsForListingTarget(params.entityId);
    }
    return { runs: [], notes: ["entity_read_model_listing_only_v1"] };
  } catch {
    return { runs: [], notes: ["entity_read_failed"] };
  }
}
