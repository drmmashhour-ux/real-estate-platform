/** Real-time close pipeline (execution layer; legacy pipelineStatus unchanged). */
export const CRM_EXECUTION_STAGES = [
  "browsing",
  "viewing_property",
  "inquiry_sent",
  "broker_connected",
  "booking_started",
  "negotiation",
  "closed",
  "lost",
] as const;

export type CrmExecutionStage = (typeof CRM_EXECUTION_STAGES)[number];

export const CRM_NEXT_ACTIONS = [
  "send_follow_up",
  "push_booking",
  "assign_broker",
  "offer_help",
  "wait",
] as const;

export type CrmNextBestAction = (typeof CRM_NEXT_ACTIONS)[number];

export type LeadScoringContext = {
  listingViews: number;
  ctaClicks: number;
  bookingStarted: boolean;
  bookingConfirmed: boolean;
  platformMessageCount: number;
  crmChatUserTurns: number;
  lastEventAt: Date | null;
  leadCreatedAt: Date;
  leadUpdatedAt: Date;
  hasIntroducedBroker: boolean;
  hasAssignedExpert: boolean;
  accountActive: boolean;
  highIntentFlag: boolean;
  messageLength: number;
};
