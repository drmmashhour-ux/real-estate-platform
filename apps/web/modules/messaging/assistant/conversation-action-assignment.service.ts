import {
  MemoryDomain,
  PlaybookAssignmentSelectionMode,
  PlaybookExecutionMode,
  PlaybookStatus,
} from "@prisma/client";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { messagingAiLog } from "./messaging-ai-logger";

export type ConversationActionEvent = "suggestion_used" | "action_executed";

type Args = {
  userId: string;
  conversationId: string;
  event: ConversationActionEvent;
  detail: Record<string, unknown>;
};

/**
 * Links assistant usage to LEADS / conversation_action when a memory playbook is available. Never throws.
 */
export async function recordConversationActionAssignment(args: Args): Promise<{ ok: true } | { ok: false }> {
  try {
    const playbook =
      (await prisma.memoryPlaybook.findFirst({
        where: { domain: MemoryDomain.LEADS, status: PlaybookStatus.ACTIVE },
        orderBy: { updatedAt: "desc" },
        select: { id: true, currentVersionId: true, executionMode: true },
      })) ??
      (await prisma.memoryPlaybook.findFirst({
        where: { status: PlaybookStatus.ACTIVE },
        orderBy: { updatedAt: "desc" },
        select: { id: true, currentVersionId: true, executionMode: true },
      }));

    if (!playbook) {
      messagingAiLog.warn("playbook_skip_no_active_playbook", { conversationId: args.conversationId });
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
        domain: MemoryDomain.LEADS,
        entityType: "conversation_action",
        entityId: args.conversationId,
        playbookId: playbook.id,
        playbookVersionId: version?.id ?? null,
        playbookVersionKey: version != null ? String(version.version) : "",
        recommendationScore: 0.4,
        selectionScore: 0.4,
        explorationRate: 0.1,
        selectionMode: PlaybookAssignmentSelectionMode.explore,
        contextSnapshot: {
          event: args.event,
          userId: args.userId,
          ...args.detail,
        } as object,
        segmentKey: "messaging_assistant",
        marketKey: null,
        fingerprint: `messaging_asst_${args.conversationId}_${args.event}_${Date.now()}`,
        executionMode: playbook.executionMode ?? PlaybookExecutionMode.RECOMMEND_ONLY,
        executed: false,
      },
    });

    messagingAiLog.assignmentRecorded({
      conversationId: args.conversationId,
      event: args.event,
    });
    return { ok: true };
  } catch (e) {
    messagingAiLog.warn("playbook_assignment_failed", {
      conversationId: args.conversationId,
      err: e instanceof Error ? e.message : String(e),
    });
    return { ok: false };
  }
}
