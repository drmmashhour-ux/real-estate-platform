import type { LifecycleStage } from "@/modules/deal-lifecycle/lifecycle.stages";

/** Rule-driven automation intent per stage (orchestration hooks — execution lives in services/cron). */
export type StageAutomationRule = {
  stage: LifecycleStage;
  summary: string;
  automations: string[];
};

export const STAGE_AUTOMATION_RULES: Record<LifecycleStage, StageAutomationRule> = {
  NEW_LEAD: {
    stage: "NEW_LEAD",
    summary: "Instant acknowledgement + ownership",
    automations: ["Trigger welcome message", "Assign broker", "Open CRM timeline"],
  },
  CONTACTED: {
    stage: "CONTACTED",
    summary: "Stay top-of-mind without spam",
    automations: ["Schedule follow-up reminder", "Log channel + outcome", "Sync CRM memory"],
  },
  QUALIFIED: {
    stage: "QUALIFIED",
    summary: "Match inventory to intent",
    automations: ["Suggest property matches", "Refine budget / area", "Tag ESG preferences if listing-linked"],
  },
  VISIT_SCHEDULED: {
    stage: "VISIT_SCHEDULED",
    summary: "Reduce no-shows",
    automations: ["Send calendar invite", "Share access + parking", "Pre-read listing ESG sheet if available"],
  },
  OFFER_SENT: {
    stage: "OFFER_SENT",
    summary: "Controlled offer tracking",
    automations: ["Acknowledge offer receipt", "Activate negotiation engine context", "Track deadlines in deal room"],
  },
  NEGOTIATION: {
    stage: "NEGOTIATION",
    summary: "Assist, don’t substitute counsel",
    automations: ["Surface AI counter suggestions (drafts only)", "Document versions", "Flag legal escalation"],
  },
  CLOSED: {
    stage: "CLOSED",
    summary: "Measure and learn",
    automations: ["Mark deal outcome (won/lost)", "Snapshot time-to-close", "Request referral / testimonial"],
  },
};

export function nextActionForStage(stage: LifecycleStage): string {
  switch (stage) {
    case "NEW_LEAD":
      return "Send intro message and assign owning broker.";
    case "CONTACTED":
      return "Set follow-up reminder and confirm best channel.";
    case "QUALIFIED":
      return "Push listing matches (incl. ESG data) and aim for a visit.";
    case "VISIT_SCHEDULED":
      return "Confirm visit logistics and disclosure expectations.";
    case "OFFER_SENT":
      return "Activate negotiation tracking and monitor response window.";
    case "NEGOTIATION":
      return "Use AI suggestions as drafts; align with counsel on terms.";
    case "CLOSED":
      return "Record outcome and archive learnings for conversion metrics.";
    default:
      return "Review pipeline and next best touch.";
  }
}

export function recommendedStepsForStage(stage: LifecycleStage): string[] {
  return STAGE_AUTOMATION_RULES[stage]?.automations ?? [];
}

/** Short AI-style nudges for dashboards and lead detail panels. */
export function aiSuggestedActionsForStage(stage: LifecycleStage): string[] {
  const map: Record<LifecycleStage, string[]> = {
    NEW_LEAD: ["Draft polite intro referencing their inquiry", "Suggest 2 discovery questions (budget + timing)"],
    CONTACTED: ["Detect silence: propose 2 meeting slots", "Summarize last touch for CRM memory"],
    QUALIFIED: ["Rank 3 listings by fit + ESG signals", "Flag financing questions before visit"],
    VISIT_SCHEDULED: ["Prep one-liner on building systems / ESG if relevant", "Send day-before SMS template"],
    OFFER_SENT: ["Summarize irrevocable window", "List counter scenarios (no legal advice)"],
    NEGOTIATION: ["Draft counter email for broker edit", "Highlight contingency risks for human review"],
    CLOSED: ["Generate win/loss note for pipeline learning", "Suggest referral ask timing"],
  };
  return map[stage] ?? [];
}

/** wiring hints for messaging, CRM, negotiation, listings/ESG — not side effects. */
export function integrationHintsForStage(stage: LifecycleStage, ctx?: { hasListingId?: boolean }): string[] {
  const base: Record<LifecycleStage, string[]> = {
    NEW_LEAD: ["messaging: open thread template", "crm_memory: capture source + intent"],
    CONTACTED: ["messaging: follow-up cadence", "crm_memory: append touch summary"],
    QUALIFIED: ["listing_data: match filters + ESG facets", "crm_memory: preference vector"],
    VISIT_SCHEDULED: ["messaging: calendar deep link", "listing_data: disclosure pack"],
    OFFER_SENT: ["negotiation_engine: load deal context", "messaging: deadline reminders"],
    NEGOTIATION: ["negotiation_engine: scenario drafts", "crm_memory: version history"],
    CLOSED: ["conversion: stamp won/lost + duration", "crm_memory: outcome notes"],
  };
  const hints = [...(base[stage] ?? [])];
  if (ctx?.hasListingId && stage === "QUALIFIED") {
    hints.push("esg: pull listing sustainability fields when present");
  }
  return hints;
}

/** Product copy for in-app / push — broker still controls delivery. */
export function notificationSuggestionsForStage(stage: LifecycleStage): string[] {
  const map: Record<LifecycleStage, string[]> = {
    NEW_LEAD: ["New lead — respond within SLA", "Assign broker confirmation"],
    CONTACTED: ["Follow-up due", "No reply in 48h — nudge"],
    QUALIFIED: ["Matches ready — review", "Client budget updated"],
    VISIT_SCHEDULED: ["Visit tomorrow — prep checklist", "Visit completed — debrief"],
    OFFER_SENT: ["Offer deadline approaching", "Counter received"],
    NEGOTIATION: ["Negotiation idle 72h — check in", "Document counter from client"],
    CLOSED: ["Deal marked closed — celebrate & learn", "Ask for referral"],
  };
  return map[stage] ?? [];
}
