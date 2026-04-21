import type {
  AssistantEngineInput,
  AssistantPriority,
  AssistantSuggestion,
  AssistantSuggestionType,
} from "./assistant.types";

const MS_DAY = 86_400_000;
const MS_HOUR = 3_600_000;

function push(
  list: AssistantSuggestion[],
  type: AssistantSuggestionType,
  message: string,
  priority: AssistantPriority,
  cap: number,
) {
  if (list.length >= cap) return;
  list.push({ type, message, priority });
}

/**
 * Deterministic, auditable coaching — not generative AI and not autonomous messaging.
 */
export function buildAssistantSuggestions(input: AssistantEngineInput, maxItems = 8): AssistantSuggestion[] {
  const out: AssistantSuggestion[] = [];
  const hours = input.hoursSinceLastBrokerAction;

  if (hours != null && hours >= 72) {
    push(
      out,
      "REMINDER",
      "No recorded touch in 72h+ — review active leads and deals before end of day.",
      "HIGH",
      maxItems,
    );
  } else if (hours != null && hours >= 24) {
    push(
      out,
      "REMINDER",
      "More than 24h since last pipeline update — schedule follow-ups while context is fresh.",
      "MEDIUM",
      maxItems,
    );
  }

  if ((input.staleLeadCount ?? 0) >= 3) {
    push(
      out,
      "ALERT",
      `${input.staleLeadCount} attributed leads look stale — batch outreach (manual send only).`,
      "HIGH",
      maxItems,
    );
  }

  const lead = input.lead;
  if (lead) {
    if (lead.pipelineStatus === "new" && lead.daysSinceTouch >= 1 && lead.daysSinceTouch < 3) {
      push(out, "ACTION", "Follow up within 24h — lead still in new stage.", "HIGH", maxItems);
    }
    if (lead.highIntent && lead.daysSinceTouch >= 2) {
      push(out, "ACTION", "High-intent lead cooling — prioritize a call or visit request.", "HIGH", maxItems);
    }
    if (lead.score >= 75 && lead.pipelineStatus === "new") {
      push(out, "ACTION", "Strong fit score — propose next step (visit or offer prep) when appropriate.", "MEDIUM", maxItems);
    }
    if (lead.daysSinceTouch >= 7) {
      push(out, "ALERT", "Lead idle 7+ days — re-engage or update stage to keep pipeline truthful.", "MEDIUM", maxItems);
    }
  }

  const deal = input.deal;
  if (deal) {
    const status = deal.status.toLowerCase();
    if (["initiated", "offer_submitted"].includes(status) && deal.daysSinceTouch >= 5) {
      push(out, "ACTION", "Deal quiet 5+ days in early stage — align buyer/seller expectations.", "MEDIUM", maxItems);
    }
    if (["inspection", "financing", "closing_scheduled"].includes(status) && deal.daysSinceTouch >= 3) {
      push(
        out,
        "REMINDER",
        "Mid-pipeline file — confirm milestones and document checklist with parties.",
        "MEDIUM",
        maxItems,
      );
    }
    if (status === "offer_submitted") {
      push(out, "ACTION", "Offer on file — review negotiation posture (suggest only; no auto-send).", "MEDIUM", maxItems);
    }
  }

  if (out.length === 0) {
    push(
      out,
      "REMINDER",
      "Stay proactive: confirm next touchpoints & update CRM notes after each client interaction.",
      "LOW",
      maxItems,
    );
  }

  return out.slice(0, maxItems);
}

export function hoursBetween(from: Date, to: Date): number {
  return Math.max(0, (to.getTime() - from.getTime()) / MS_HOUR);
}

export function daysBetween(from: Date, to: Date): number {
  return Math.max(0, (to.getTime() - from.getTime()) / MS_DAY);
}
