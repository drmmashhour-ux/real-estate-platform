import {
  MemoryDomain,
  PlaybookAssignmentSelectionMode,
  PlaybookExecutionMode,
  PlaybookStatus,
} from "@prisma/client";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { dealCloserLog } from "@/modules/deal-closer/deal-closer-logger";

/**
 * Optional learning hook: log recommended close actions to DEALS / close_action. Never throws.
 */
export async function recordCloseActionAssignment(args: {
  userId: string;
  dealId: string;
  topActionKey: string;
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
      dealCloserLog.warn("playbook_skip_deals", { dealId: args.dealId });
      return { ok: false };
    }

    const version = playbook.currentVersionId
      ? await prisma.memoryPlaybookVersion.findUnique({
          where: { id: playbook.currentVersionId },
          select: { id: true, version: true },
        })
      : null;

    await prisma.playbookAssignment.create({
      data: {
        domain: MemoryDomain.DEALS,
        entityType: "close_action",
        entityId: args.dealId,
        playbookId: playbook.id,
        playbookVersionId: version?.id ?? null,
        playbookVersionKey: version != null ? String(version.version) : "",
        recommendationScore: 0.45,
        selectionScore: 0.45,
        explorationRate: 0.1,
        selectionMode: PlaybookAssignmentSelectionMode.explore,
        contextSnapshot: {
          topActionKey: args.topActionKey,
          userId: args.userId,
          source: "deal_closer",
          ...args.detail,
        } as object,
        segmentKey: "deal_closer",
        marketKey: null,
        fingerprint: `deal_closer_${args.dealId}_${args.topActionKey}_${Date.now()}`,
        executionMode: playbook.executionMode ?? PlaybookExecutionMode.RECOMMEND_ONLY,
        executed: false,
      },
    });

    return { ok: true };
  } catch (e) {
    dealCloserLog.warn("close_action_assignment_failed", {
      dealId: args.dealId,
      err: e instanceof Error ? e.message : String(e),
    });
    return { ok: false };
  }
}
