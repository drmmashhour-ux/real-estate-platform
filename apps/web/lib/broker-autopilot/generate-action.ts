import type { AutopilotCandidate } from "@/lib/broker-autopilot/rules";
import { prisma } from "@/lib/db";
import { shouldCreateAutopilotAction } from "@/lib/broker-autopilot/action-dedupe";
import { generateAutopilotFollowupDraft } from "@/lib/broker-autopilot/generate-followup-draft";
import { trackBrokerAutopilot } from "@/lib/broker-autopilot/analytics";

export async function insertAutopilotAction(input: {
  brokerUserId: string;
  leadId: string;
  threadId: string | null;
  candidate: AutopilotCandidate;
  threadLastMessageAt: Date | null;
  autoDraftFollowups: boolean;
  aiDraftBudget: { remaining: number; decrement(): void };
}): Promise<boolean> {
  const { brokerUserId, leadId, threadId, candidate, threadLastMessageAt, autoDraftFollowups, aiDraftBudget } =
    input;

  const allow = await shouldCreateAutopilotAction({
    leadId,
    reasonBucket: candidate.reasonBucket,
    threadLastMessageAt,
  });
  if (!allow) return false;

  let draftMessage: string | null = null;
  const wantsAiDraft =
    autoDraftFollowups &&
    aiDraftBudget.remaining > 0 &&
    (candidate.actionType === "reply_now" || candidate.actionType === "follow_up_due");

  if (wantsAiDraft) {
    try {
      const { draft } = await generateAutopilotFollowupDraft(leadId, brokerUserId);
      draftMessage = draft;
      aiDraftBudget.decrement();
    } catch {
      draftMessage = null;
    }
  }

  await prisma.lecipmBrokerAutopilotAction.create({
    data: {
      brokerUserId,
      leadId,
      threadId,
      actionType: candidate.actionType,
      status: "suggested",
      title: candidate.title,
      reason: candidate.reason,
      reasonBucket: candidate.reasonBucket,
      draftMessage,
      scheduledFor: candidate.scheduledFor ?? null,
    },
  });

  trackBrokerAutopilot(
    "broker_autopilot_action_suggested",
    { leadId, actionType: candidate.actionType, reasonBucket: candidate.reasonBucket },
    { userId: brokerUserId }
  );
  return true;
}
