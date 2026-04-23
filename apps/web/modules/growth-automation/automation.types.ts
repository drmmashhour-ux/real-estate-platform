import type { LeadIntent } from "@/modules/growth-leads/leads.types";

export type AutomationChannel = "EMAIL" | "SMS" | "CONTENT";

/** High-level nurture programs */
export type AutomationFlowId = "NEW_LEAD" | "BROKER_LEAD" | "INVESTOR_LEAD";

export type DelayPreset = "immediate" | "plus_1d" | "plus_3d";

export type PersonalizationContext = {
  name?: string;
  intent: LeadIntent;
  /** City, region, or coarse geo label */
  location?: string;
  /** Pass-through from growth-leads behavior signals */
  listingViews?: number;
  clickedCta?: boolean;
  marketingClick?: boolean;
};

export type FlowStepDefinition = {
  id: string;
  channel: AutomationChannel;
  delay: DelayPreset;
  /** Keys mapped in email/sms renderers */
  templateKey: string;
};

export type ScheduledAutomationStep = FlowStepDefinition & {
  /** ISO time when this step becomes due */
  executeAtIso: string;
  /** Stable key for idempotency per run */
  runKey: string;
};

export type AutomationRun = {
  id: string;
  flowId: AutomationFlowId;
  leadKey: string;
  personalization: PersonalizationContext;
  createdAtIso: string;
  steps: ScheduledAutomationStep[];
};

export type MessageMetrics = {
  opens: number;
  clicks: number;
  replied: boolean;
  converted: boolean;
};

export type OutboundMessage = {
  id: string;
  runId: string;
  channel: AutomationChannel;
  templateKey: string;
  /** EMAIL: combined preview; SMS: body only */
  subject?: string;
  body: string;
  sentAtIso: string;
  leadKey: string;
  metrics: MessageMetrics;
};

export type AutomationTrackingStats = {
  messageCount: number;
  openRate: number;
  clickRate: number;
  replyRate: number;
  conversionRate: number;
};
