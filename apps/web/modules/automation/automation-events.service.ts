import type { AutomationEvent, AutomationLogEntry, SafeResult } from "./automation.types";
import { routeAutomationEvent } from "./automation-router.service";

/**
 * Catalog mirrors docs/ai/event-trigger-automation-spec.md (read-only registry for UI + logs).
 */
export const AUTOMATION_TRIGGER_CATALOG = [
  {
    id: "new_listing",
    title: "New listing",
    eventSource: "Listing / ShortTermListing status",
    output: "Quality checklist",
    approvalRule: "No auto-publish",
  },
  {
    id: "low_completion_listing",
    title: "Low completion listing",
    eventSource: "Scheduled completeness job",
    output: "Prioritized suggestions",
    approvalRule: "User accepts changes",
  },
  {
    id: "high_search_demand",
    title: "High search demand",
    eventSource: "Search analytics",
    output: "Demand insight + pricing pointer",
    approvalRule: "Host/autonomy policy",
  },
  {
    id: "booking_confirmed",
    title: "Booking confirmed",
    eventSource: "Booking transition",
    output: "Digest line / draft upsell",
    approvalRule: "Draft messaging human-send",
  },
  {
    id: "payout_anomaly",
    title: "Payout anomaly",
    eventSource: "Stripe / reconciliation",
    output: "Risk routing suggestion",
    approvalRule: "Finance playbook",
  },
  {
    id: "lead_high_intent",
    title: "Lead purchased / high intent",
    eventSource: "CRM ingest",
    output: "Rank boost + draft",
    approvalRule: "Outbound human-send (v1)",
  },
  {
    id: "investor_signal",
    title: "Investor signal",
    eventSource: "InvestmentRecommendation",
    output: "Opportunity summary",
    approvalRule: "Read-only; no execution",
  },
  {
    id: "low_occupancy",
    title: "Low occupancy",
    eventSource: "BNHub KPI",
    output: "Host revenue bundle",
    approvalRule: "Autonomy policy",
  },
  {
    id: "signup",
    title: "New user signup",
    eventSource: "Auth registration",
    output: "Onboarding checklist",
    approvalRule: "Marketing templates",
  },
  {
    id: "conversion_drop",
    title: "Conversion drop",
    eventSource: "Analytics funnel",
    output: "Admin summary bullet",
    approvalRule: "Experiments governance",
  },
] as const;

function safeLog(entry: AutomationLogEntry): void {
  try {
    console.info("[automation]", JSON.stringify(entry));
  } catch {
    /* ignore */
  }
}

/**
 * Entry point for event ingestion — **never throws**.
 */
export async function dispatchAutomationEvent(event: AutomationEvent): Promise<SafeResult<{ routed: boolean }>> {
  try {
    const routed = await routeAutomationEvent(event);
    const log: AutomationLogEntry = {
      at: new Date().toISOString(),
      kind: event.type,
      hub: "admin",
      actionClass: "recommendation",
      reasonCodes: [{ code: "ROUTED", message: routed ? "handler invoked" : "no handler" }],
      detail: event.payload.id,
    };
    safeLog(log);
    return { ok: true, data: { routed }, log };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "dispatch failed";
    return {
      ok: false,
      error: msg,
      code: "AUTOMATION_DISPATCH",
      log: {
        at: new Date().toISOString(),
        kind: event.type,
        hub: "admin",
        actionClass: "recommendation",
        reasonCodes: [{ code: "ERROR", message: msg }],
      },
    };
  }
}
