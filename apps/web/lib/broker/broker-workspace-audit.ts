import { prisma } from "@/lib/db";

/** Stable keys for `BrokerWorkspaceAuditEvent.actionKey` (analytics + compliance). */
export const brokerWorkspaceAuditKeys = {
  kpiBoardViewed: "broker.kpi_board.viewed",
  teamWorkspaceViewed: "broker.team_workspace.viewed",
  assignmentCreated: "broker.assignment.created",
  assignmentUpdated: "broker.assignment.updated",
  internalNoteCreated: "broker.internal_note.created",
  threadCreated: "broker.collaboration.thread.created",
  messagePosted: "broker.collaboration.message.posted",
  reassignmentSuggested: "broker.workload.reassign_suggested",
  reassignmentApplied: "broker.workload.reassign_applied",
  bottleneckDetected: "broker.workload.bottleneck_detected",
  overdueResolved: "broker.workload.overdue_resolved",
  restrictedThreadViewed: "broker.collaboration.thread.viewed_restricted",
  dealAutopilotViewed: "broker.deal_autopilot.viewed",
  dealAutopilotRun: "broker.deal_autopilot.run",
  dealAutopilotNextStepComplete: "broker.deal_autopilot.next_step.complete",
  dealAutopilotCommunicationDraft: "broker.deal_autopilot.communication_draft",
  negotiationAutopilotViewed: "broker.negotiation_autopilot.viewed",
  negotiationAutopilotRun: "broker.negotiation_autopilot.run",
  negotiationScenarioApproved: "broker.negotiation_autopilot.scenario.approved",
  negotiationScenarioRejected: "broker.negotiation_autopilot.scenario.rejected",
  growthDashboardViewed: "broker.growth_dashboard.viewed",
  growthRecommendationGenerated: "broker.growth.recommendation.generated",
  marketingSuggestionGenerated: "broker.marketing.suggestion.generated",
  marketingDraftGenerated: "broker.marketing.draft.generated",
  marketingDraftApproved: "broker.marketing.draft.approved",
  marketingDraftRejected: "broker.marketing.draft.rejected",
  marketingDraftScheduled: "broker.marketing.draft.scheduled",
  marketingDraftPublished: "broker.marketing.draft.published",
  listingHealthScoreComputed: "broker.listing.health_score.computed",
  staleListingRevivalSuggested: "broker.listing.stale_revival.suggested",
  priceChangeCampaignSuggested: "broker.listing.price_change_campaign.suggested",
  ownerDashboardViewed: "owner.dashboard.viewed",
  ownerStrategyBoardViewed: "owner.strategy_board.viewed",
  ownerStrategyInsightGenerated: "owner.strategy.insight.generated",
  ownerScenarioGenerated: "owner.forecast.scenario.generated",
  ownerPriorityReviewed: "owner.priority.reviewed",
  ownerBottleneckDetected: "owner.bottleneck.detected",
  ownerOpportunityFlagged: "owner.opportunity.flagged",
  founderWorkspaceViewed: "founder.workspace.viewed",
  founderCopilotRun: "founder.copilot.run",
  founderCopilotQuestion: "founder.copilot.question",
  founderBriefingGenerated: "founder.briefing.generated",
  founderBriefingViewed: "founder.briefing.viewed",
  founderBriefingReviewed: "founder.briefing.reviewed",
  founderBriefingDeliveryDraft: "founder.briefing.delivery_draft",
  founderActionCreated: "founder.action.created",
  founderActionUpdated: "founder.action.updated",
  founderDecisionLogged: "founder.decision.logged",
} as const;

export async function logBrokerWorkspaceEvent(input: {
  actorUserId: string;
  actionKey: string;
  teamId?: string | null;
  dealId?: string | null;
  threadId?: string | null;
  payload?: Record<string, unknown>;
}): Promise<void> {
  await prisma.brokerWorkspaceAuditEvent.create({
    data: {
      actorUserId: input.actorUserId,
      actionKey: input.actionKey,
      teamId: input.teamId ?? undefined,
      dealId: input.dealId ?? undefined,
      threadId: input.threadId ?? undefined,
      payload: (input.payload ?? {}) as object,
    },
  });
}
