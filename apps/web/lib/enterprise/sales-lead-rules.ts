import { EnterpriseLeadStage } from "@prisma/client";

/** Suggested score from stage — override manually; used when applying light automation. */
export function suggestedLeadScoreFromStage(stage: EnterpriseLeadStage): number {
  switch (stage) {
    case EnterpriseLeadStage.LEAD_IDENTIFIED:
      return 15;
    case EnterpriseLeadStage.CONTACTED:
      return 30;
    case EnterpriseLeadStage.INTERESTED:
      return 50;
    case EnterpriseLeadStage.DEMO_SCHEDULED:
      return 70;
    case EnterpriseLeadStage.NEGOTIATION:
      return 85;
    case EnterpriseLeadStage.CLOSED_WON:
      return 100;
    case EnterpriseLeadStage.CLOSED_LOST:
      return 0;
    default:
      return 20;
  }
}
