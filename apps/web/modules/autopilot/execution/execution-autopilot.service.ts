import { prisma } from "@/lib/db";
import { getOverdueConditions } from "@/modules/deal-execution/deadline-tracker.service";
import { getLatestSignatureSummary } from "@/modules/signature/signature-tracking.service";

export type ExecutionAutopilotSuggestion = {
  code: string;
  severity: "low" | "medium" | "high";
  message: string;
  suggestedAction: "send_reminder" | "request_document" | "escalate" | "review";
};

/**
 * Rule-based suggestions — not automatic legal actions.
 */
export async function runExecutionAutopilot(dealId: string): Promise<ExecutionAutopilotSuggestion[]> {
  const suggestions: ExecutionAutopilotSuggestion[] = [];

  const overdue = await getOverdueConditions(dealId);
  if (overdue.length) {
    suggestions.push({
      code: "conditions_overdue",
      severity: "high",
      message: `${overdue.length} condition(s) past deadline — broker review.`,
      suggestedAction: "escalate",
    });
  }

  const sig = await getLatestSignatureSummary(dealId);
  if (sig && sig.status === "sent" && sig.signedCount === 0) {
    suggestions.push({
      code: "signature_pending",
      severity: "medium",
      message: "Signature session sent — follow up with participants.",
      suggestedAction: "send_reminder",
    });
  }

  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    select: { lecipmExecutionPipelineState: true },
  });
  if (deal?.lecipmExecutionPipelineState === "broker_review_required") {
    suggestions.push({
      code: "awaiting_broker_approval",
      severity: "medium",
      message: "Deal awaiting broker approval for execution prep.",
      suggestedAction: "review",
    });
  }

  await prisma.dealExecutionAuditLog.create({
    data: {
      dealId,
      actorUserId: null,
      actionKey: "execution_autopilot_run",
      payload: { suggestionCount: suggestions.length },
    },
  });

  return suggestions;
}
