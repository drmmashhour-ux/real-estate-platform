import {
  MemoryDomain,
  PlaybookAssignmentSelectionMode,
  PlaybookExecutionMode,
  PlaybookStatus,
} from "@prisma/client";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { negSimLog } from "./negotiation-simulator-logger";

/**
 * Optional learning hook: DEALS / negotiation_strategy_action. Never throws.
 */
export async function recordNegotiationStrategyAssignment(args: {
  userId: string;
  dealId: string;
  safestApproach: string | null;
  highestUpsideApproach: string | null;
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
      negSimLog.warn("playbook_skip", { dealId: args.dealId });
      return { ok: false };
    }
    const version = playbook.currentVersionId
      ? await prisma.memoryPlaybookVersion.findUnique({ where: { id: playbook.currentVersionId }, select: { id: true, version: true } })
      : null;
    const top = args.highestUpsideApproach ?? args.safestApproach ?? "n/a";
    await prisma.playbookAssignment.create({
      data: {
        domain: MemoryDomain.DEALS,
        entityType: "negotiation_strategy_action",
        entityId: args.dealId,
        playbookId: playbook.id,
        playbookVersionId: version?.id ?? null,
        playbookVersionKey: version != null ? String(version.version) : "",
        recommendationScore: 0.4,
        selectionScore: 0.4,
        explorationRate: 0.1,
        selectionMode: PlaybookAssignmentSelectionMode.explore,
        contextSnapshot: {
          safestApproach: args.safestApproach,
          highestUpsideApproach: args.highestUpsideApproach,
          topForLearning: top,
          userId: args.userId,
          source: "negotiation_simulator",
          ...args.detail,
        } as object,
        segmentKey: "negotiation_simulator",
        marketKey: null,
        fingerprint: `neg_sim_${args.dealId}_${top}_${Date.now()}`,
        executionMode: playbook.executionMode ?? PlaybookExecutionMode.RECOMMEND_ONLY,
        executed: false,
      },
    });
    return { ok: true };
  } catch (e) {
    negSimLog.warn("neg_sim_assignment_fail", { err: e instanceof Error ? e.message : String(e) });
    return { ok: false };
  }
}

/**
 * When the broker records they are adopting a suggested path (suggestion only; no message send).
 */
export async function recordNegotiationStrategyUsageEvent(args: {
  userId: string;
  dealId: string;
  chosenApproachKey: string;
}): Promise<void> {
  try {
    negSimLog.run({
      event: "broker_strategy_chosen",
      dealId: args.dealId,
      approach: args.chosenApproachKey,
      userId: args.userId,
    });
  } catch {
    /* no-op */
  }
}
