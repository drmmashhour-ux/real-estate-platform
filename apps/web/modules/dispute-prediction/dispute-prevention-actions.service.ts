import type { LecipmPreDisputeRiskLevel } from "@prisma/client";

import { evaluateBookingRisk } from "@/modules/risk-engine/risk-prevention.service";

import { logDisputePrevention } from "./dispute-prediction-log";

export type PreventionActionDescriptor = { kind: string; detail: string };

/**
 * Maps prediction band to operational responses. **Never punitive** — reminders, visibility, queues, manual review gates.
 */
export function mapPredictionBandToActions(input: {
  band: LecipmPreDisputeRiskLevel;
  entityKind: "BOOKING" | "DEAL" | "LISTING" | "PAYMENT";
  entityId: string;
}): PreventionActionDescriptor[] {
  const out: PreventionActionDescriptor[] = [];
  switch (input.band) {
    case "LOW":
      out.push({
        kind: "monitor_only",
        detail:
          "Continue passive monitoring — no outbound automation required for LOW band in default policy.",
      });
      break;
    case "MEDIUM":
      out.push(
        {
          kind: "send_clarification_reminder",
          detail:
            "Optional neutral reminder via existing notification surfaces — tone factual, no fault assignment.",
        },
        {
          kind: "confirm_expectations",
          detail: "Prompt explicit confirmation of dates, access, and payment path on-thread.",
        },
        {
          kind: "assistant_follow_up",
          detail: "Surface assistive follow-up templates for broker/host where applicable.",
        }
      );
      break;
    case "HIGH":
      out.push(
        {
          kind: "notify_broker",
          detail: "Broker visibility ping with dispute-risk context (advisory).",
        },
        {
          kind: "require_explicit_reconfirmation",
          detail: "Require explicit confirmation step before material automation branches on this flow.",
        },
        {
          kind: "pause_risky_automation_hint",
          detail:
            "Flag flow for reduced autopilot aggressiveness until confirmation — execution gated by existing policy modules.",
        },
        {
          kind: "highlight_docs_terms",
          detail: "Elevate missing-doc / compliance checklist visibility for this entity.",
        }
      );
      break;
    case "CRITICAL":
      out.push(
        {
          kind: "manual_review_required",
          detail: "Route to operator review queue — no automatic punitive listing or account actions.",
        },
        {
          kind: "block_sensitive_next_steps_until_review",
          detail:
            "Hold high-impact automation steps pending human acknowledgement (policy-controlled feature flags).",
        },
        {
          kind: "optional_admin_escalation",
          detail: "Offer admin escalation channel when configured — informational escalation only.",
        }
      );
      break;
    default:
      break;
  }
  return out;
}

/**
 * Executes prevention only where safe defaults exist today (booking → existing risk engine notifications).
 */
export async function executePredictionPrevention(input: {
  band: LecipmPreDisputeRiskLevel;
  entityKind: "BOOKING" | "DEAL" | "LISTING" | "PAYMENT";
  entityId: string;
}): Promise<PreventionActionDescriptor[]> {
  const descriptors = mapPredictionBandToActions(input);
  if (input.band === "LOW") {
    logDisputePrevention("skipped_execution_low_band", { entityId: input.entityId });
    return descriptors;
  }

  if (input.entityKind === "BOOKING" && (input.band === "MEDIUM" || input.band === "HIGH" || input.band === "CRITICAL")) {
    try {
      await evaluateBookingRisk(input.entityId, {
        triggerPrevention: input.band !== "LOW",
      });
      logDisputePrevention("booking_prevention_delegate", {
        bookingId: input.entityId,
        band: input.band,
      });
    } catch (e) {
      console.warn("[dispute-prediction] prevention delegate failed", e);
    }
  }

  return descriptors;
}
