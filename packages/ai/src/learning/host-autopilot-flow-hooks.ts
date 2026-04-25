import { prisma } from "@/lib/db";
import { logOutcome } from "./outcome-signals";
import { updateRulePerformance } from "./rule-performance";
import type { OutcomeType } from "./feedback-score";
import { recordConfidence } from "./confidence-calibration";
import { extractAutopilotTemplateKey, recordTemplateOutcome } from "./template-performance";

const HOST_AUTOPILOT_PROMOTION_RULE = "host_autopilot_promotion_suggestion";

function isAutopilotPromotionPayload(payload: unknown): boolean {
  if (payload === null || typeof payload !== "object" || Array.isArray(payload)) return false;
  return (payload as { autopilot?: unknown }).autopilot === true;
}

type ApprovalRow = {
  actionKey: string;
  targetEntityType: string;
  targetEntityId: string;
  payload: unknown;
  confidence?: number | null;
};

function listingOrBookingIds(row: ApprovalRow): { listingId?: string; bookingId?: string } {
  if (row.targetEntityType === "short_term_listing") return { listingId: row.targetEntityId };
  if (row.targetEntityType === "booking") return { bookingId: row.targetEntityId };
  return {};
}

/** After host approves or rejects a pending Manager AI approval (Host Autopilot UI). */
export async function recordHostAutopilotApprovalReview(input: {
  hostId: string;
  row: ApprovalRow;
  outcomeType: OutcomeType;
}): Promise<void> {
  const { listingId, bookingId } = listingOrBookingIds(input.row);
  const templateKey = extractAutopilotTemplateKey(input.row.payload);
  await logOutcome({
    hostId: input.hostId,
    listingId,
    bookingId,
    ruleName: input.row.actionKey,
    actionType: "host_autopilot_approval",
    outcomeType: input.outcomeType,
    templateKey,
    metadata: { targetEntityType: input.row.targetEntityType },
  });
  await updateRulePerformance(input.row.actionKey, input.outcomeType);

  if (templateKey) {
    await recordTemplateOutcome(templateKey, input.row.actionKey, input.outcomeType);
  }
  const conf = input.row.confidence != null && Number.isFinite(input.row.confidence) ? input.row.confidence : 0.5;
  await recordConfidence(input.row.actionKey, conf, input.outcomeType);
}

export function approvalOutcomeAfterApply(row: ApprovalRow, appliedOk: boolean): OutcomeType {
  if (!appliedOk) return "failure";
  const payload = row.payload as { kind?: string } | null | undefined;
  const appliedListingCopy =
    row.targetEntityType === "short_term_listing" && payload?.kind === "listing_optimization_apply";
  return appliedListingCopy ? "applied" : "approved";
}

/** Dismissed recommendation was created by Host Autopilot promotion suggestion. */
export async function recordAutopilotPromotionDismissIfApplicable(input: {
  userId: string;
  rec: {
    agentKey: string;
    payload: unknown;
    targetEntityType: string;
    targetEntityId: string;
    confidence?: number | null;
  };
}): Promise<void> {
  if (input.rec.agentKey !== "revenue" || !isAutopilotPromotionPayload(input.rec.payload)) return;
  if (input.rec.targetEntityType !== "short_term_listing") return;

  const tk = extractAutopilotTemplateKey(input.rec.payload);
  await logOutcome({
    hostId: input.userId,
    listingId: input.rec.targetEntityId,
    ruleName: HOST_AUTOPILOT_PROMOTION_RULE,
    actionType: "promotion_review",
    outcomeType: "rejected",
    templateKey: tk,
    metadata: { source: "dismiss_recommendation" },
  });
  await updateRulePerformance(HOST_AUTOPILOT_PROMOTION_RULE, "rejected");

  if (tk) {
    await recordTemplateOutcome(tk, HOST_AUTOPILOT_PROMOTION_RULE, "rejected");
  }
  const conf =
    input.rec.confidence != null && Number.isFinite(input.rec.confidence) ? input.rec.confidence : 0.5;
  await recordConfidence(HOST_AUTOPILOT_PROMOTION_RULE, conf, "rejected");
}

/** Host ran “Act” on a promotion idea while an Autopilot promotion card is still active for that listing. */
export async function recordAutopilotPromotionActIfApplicable(input: {
  userId: string;
  listingId: string;
}): Promise<void> {
  const hit = await prisma.managerAiRecommendation.findFirst({
    where: {
      userId: input.userId,
      targetEntityType: "short_term_listing",
      targetEntityId: input.listingId,
      status: "active",
      agentKey: "revenue",
      payload: { path: ["autopilot"], equals: true },
    },
    select: { id: true, payload: true, confidence: true },
  });
  if (!hit) return;

  const tk = extractAutopilotTemplateKey(hit.payload);
  await logOutcome({
    hostId: input.userId,
    listingId: input.listingId,
    ruleName: HOST_AUTOPILOT_PROMOTION_RULE,
    actionType: "promotion_review",
    outcomeType: "applied",
    templateKey: tk,
    metadata: { source: "recommend_promotion" },
  });
  if (tk) {
    await recordTemplateOutcome(tk, HOST_AUTOPILOT_PROMOTION_RULE, "applied");
  }
  const conf = hit.confidence != null && Number.isFinite(hit.confidence) ? hit.confidence : 0.5;
  await recordConfidence(HOST_AUTOPILOT_PROMOTION_RULE, conf, "applied");

  await updateRulePerformance(HOST_AUTOPILOT_PROMOTION_RULE, "applied");
}
