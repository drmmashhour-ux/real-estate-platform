import type { DealIntelligenceStage } from "./deal.types";
import type { ScoreInputs } from "./deal-score.calculator";
import { mapStatusToIntelligenceStage } from "./deal-score.calculator";

export function suggestNextBestAction(params: {
  status: string;
  intelligenceStage: DealIntelligenceStage;
  daysSinceLastActivity: number;
  hasVisitEvent: boolean;
  listPriceGapPct: number | null;
  negotiationRoundMax: number;
  rejectedProposals: number;
  documentsSent: boolean;
  scoreInputs: ScoreInputs;
}): string {
  const { status } = params;
  if (status === "cancelled") {
    return "Review cancellation — archive file or revive with a fresh strategy";
  }
  if (status === "closed") {
    return "Celebrate close — confirm commission capture and client retention touch";
  }

  if (params.daysSinceLastActivity > 10) {
    return "Follow up now";
  }

  if ((params.intelligenceStage === "VIEWING" || status === "initiated") && !params.hasVisitEvent) {
    return "Schedule visit";
  }

  if (params.listPriceGapPct != null && params.listPriceGapPct > 8) {
    return "Reduce price by 3%";
  }

  if (params.negotiationRoundMax >= 4 || params.rejectedProposals >= 2) {
    return "Escalate negotiation";
  }

  if (
    ["accepted", "inspection", "financing"].includes(status) &&
    !params.documentsSent &&
    params.scoreInputs.milestoneTotal > 0
  ) {
    return "Send documents";
  }

  if (params.negotiationRoundMax >= 2) {
    return "Escalate negotiation";
  }

  return "Keep momentum — sync with buyer and seller this week";
}

export { mapStatusToIntelligenceStage };
