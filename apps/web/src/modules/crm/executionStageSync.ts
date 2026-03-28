import type { CrmExecutionStage } from "./crmExecutionTypes";
import type { LeadScoringContext } from "./crmExecutionTypes";

export type StageSignals = {
  ctx: LeadScoringContext;
  pipelineStatus: string;
  pipelineStage: string;
  lostAt: Date | null;
  wonAt: Date | null;
  dealClosedAt: Date | null;
};

/**
 * Derives execution stage from telemetry context + legacy pipeline fields.
 */
export function deriveExecutionStage(sig: StageSignals): CrmExecutionStage {
  if (sig.lostAt) return "lost";
  if (sig.wonAt || sig.dealClosedAt || sig.ctx.bookingConfirmed) return "closed";

  const p = `${sig.pipelineStatus} ${sig.pipelineStage}`.toLowerCase();
  if (p.includes("negotiation") || p.includes("offer")) return "negotiation";

  if (sig.ctx.bookingStarted) return "booking_started";

  if (sig.ctx.hasIntroducedBroker || sig.ctx.hasAssignedExpert) return "broker_connected";

  if (sig.ctx.messageLength > 15 || sig.ctx.crmChatUserTurns > 0 || p.includes("contact")) {
    return "inquiry_sent";
  }

  if (sig.ctx.listingViews > 0 || sig.ctx.ctaClicks > 0) return "viewing_property";

  return "browsing";
}
