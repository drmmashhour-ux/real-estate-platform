import type { CrmNextBestAction, LeadScoringContext } from "./crmExecutionTypes";

export type NextActionInput = {
  ctx: LeadScoringContext;
  intent: number;
  urgency: number;
  friction: number;
  executionStage: string;
  hoursSinceActivity: number;
};

/**
 * Returns ONE primary action for operators / automation.
 */
export function resolveNextBestAction(input: NextActionInput): CrmNextBestAction {
  const { ctx, intent, urgency, friction, executionStage, hoursSinceActivity } = input;

  if (executionStage === "lost" || executionStage === "closed") {
    return "wait";
  }

  if (ctx.bookingStarted && !ctx.bookingConfirmed) {
    return "push_booking";
  }

  if (
    (executionStage === "inquiry_sent" || ctx.messageLength > 20) &&
    !ctx.hasIntroducedBroker &&
    !ctx.hasAssignedExpert &&
    intent > 35
  ) {
    return "assign_broker";
  }

  if (intent > 55 && hoursSinceActivity > 6 && urgency < 55) {
    return "send_follow_up";
  }

  if (intent > 45 && (friction > 45 || executionStage === "viewing_property")) {
    return "offer_help";
  }

  if (intent < 25 && hoursSinceActivity > 48) {
    return "wait";
  }

  if (hoursSinceActivity > 24 && intent > 60) {
    return "send_follow_up";
  }

  return intent > 40 ? "offer_help" : "wait";
}
