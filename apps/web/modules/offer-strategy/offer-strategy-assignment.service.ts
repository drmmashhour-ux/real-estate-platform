import {
  MemoryDomain,
  PlaybookAssignmentSelectionMode,
  PlaybookExecutionMode,
  PlaybookStatus,
} from "@prisma/client";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { offerStrategyLog } from "@/modules/offer-strategy/offer-strategy-logger";

/**
 * Optional learning hook: DEALS / offer_strategy_action. Never throws.
 */
export async function recordOfferStrategyAssignment(args: {
  userId: string;
  dealId: string;
  topRecKey: string;
  detail?: Record<string, unknown>;
}): Promise<{ ok: true } | { ok: false }> {
  try {
    const playbook =
      (await prisma.memoryPlaybook.findFirst({
        where: { domain: MemoryDomain.DEALS, status: PlaybookStatus.ACTIVE },
        orderBy: { updatedAt: "desc" },
        select: { id: true, currentVersionId: true, executionMode: true },
      })) ??
      (await prisma.memoryPlaybook.findFirst({
        where: { status: PlaybookStatus.ACTIVE },
        orderBy: { updatedAt: "desc" },
        select: { id: true, currentVersionId: true, executionMode: true },
      }));
    if (!playbook) {
      offerStrategyLog.warn("playbook_skip", { dealId: args.dealId });
      return { ok: false };
    }
    const version = playbook.currentVersionId
      ? await prisma.memoryPlaybookVersion.findUnique({ where: { id: playbook.currentVersionId }, select: { id: true, version: true } })
      : null;
    await prisma.playbookAssignment.create({
      data: {
        domain: MemoryDomain.DEALS,
        entityType: "offer_strategy_action",
        entityId: args.dealId,
        playbookId: playbook.id,
        playbookVersionId: version?.id ?? null,
        playbookVersionKey: version != null ? String(version.version) : "",
        recommendationScore: 0.44,
        selectionScore: 0.44,
        explorationRate: 0.1,
        selectionMode: PlaybookAssignmentSelectionMode.explore,
        contextSnapshot: { topRecKey: args.topRecKey, userId: args.userId, source: "offer_strategy", ...args.detail } as object,
        segmentKey: "offer_strategy",
        marketKey: null,
        fingerprint: `offer_strat_${args.dealId}_${args.topRecKey}_${Date.now()}`,
        executionMode: playbook.executionMode ?? PlaybookExecutionMode.RECOMMEND_ONLY,
        executed: false,
      },
    });
    return { ok: true };
  } catch (e) {
    offerStrategyLog.warn("offer_strategy_assignment_fail", { err: e instanceof Error ? e.message : String(e) });
    return { ok: false };
  }
}
