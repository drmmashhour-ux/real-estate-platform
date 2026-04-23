import { createHash } from "node:crypto";

import type {
  AssistantActionType,
  AssistantEngineInput,
  AssistantExecutionStatus,
  AssistantPriority,
  AssistantSuggestion,
  AssistantSuggestionType,
} from "./assistant.types";

const MS_DAY = 86_400_000;
const MS_HOUR = 3_600_000;

function makeSuggestionId(type: string, priority: string, message: string, context: string): string {
  return createHash("sha256")
    .update([type, priority, message, context].join("|"))
    .digest("hex")
    .slice(0, 24);
}

type ActionOpts = {
  actionType: AssistantActionType;
  payload: Record<string, unknown>;
  requiresConfirmation?: boolean;
  status?: AssistantExecutionStatus;
};

function push(
  list: AssistantSuggestion[],
  type: AssistantSuggestionType,
  message: string,
  priority: AssistantPriority,
  maxItems: number,
  contextKey: string,
  action?: ActionOpts,
) {
  if (list.length >= maxItems) return;
  const id = makeSuggestionId(type, priority, message, contextKey);
  const base: AssistantSuggestion = { id, type, message, priority };
  if (action) {
    base.actionType = action.actionType;
    base.actionPayload = action.payload;
    base.requiresConfirmation = action.requiresConfirmation ?? true;
    base.executionStatus = action.status ?? "idle";
  }
  list.push(base);
}

/**
 * Deterministic coaching — optional executable actions when route context (`leadId`/`dealId`) is present.
 */
export function buildAssistantSuggestions(input: AssistantEngineInput, maxItems = 8): AssistantSuggestion[] {
  const out: AssistantSuggestion[] = [];
  const ck = `${input.contextLeadId ?? ""}:${input.contextDealId ?? ""}`;
  const lid = input.contextLeadId ?? undefined;
  const did = input.contextDealId ?? undefined;

  if (did) {
    push(
      out,
      "REMINDER",
      "OACIQ — buyers should be advised to obtain a professional inspection (still advisable if a pre-sale inspection exists). Document your VERIFY → INFORM → ADVISE trail.",
      "HIGH",
      maxItems,
      `${ck}:inspection`,
    );
  }

  const hours = input.hoursSinceLastBrokerAction;

  if (hours != null && hours >= 72) {
    push(
      out,
      "REMINDER",
      "No recorded touch in 72h+ — review active leads and deals before end of day.",
      "HIGH",
      maxItems,
      ck,
      lid
        ? {
            actionType: "SEND_FOLLOWUP",
            payload: { leadId: lid },
            requiresConfirmation: true,
          }
        : undefined,
    );
  } else if (hours != null && hours >= 24) {
    push(out, "REMINDER", "More than 24h since last pipeline update — schedule follow-ups while context is fresh.", "MEDIUM", maxItems, ck);
  }

  if ((input.staleLeadCount ?? 0) >= 3) {
    push(
      out,
      "ALERT",
      `${input.staleLeadCount} attributed leads look stale — batch outreach (manual send only).`,
      "HIGH",
      maxItems,
      ck,
      lid
        ? {
            actionType: "ESCALATE_TO_ADMIN",
            payload: {
              leadId: lid,
              summary: "Stale pipeline — broker requested ops visibility from assistant.",
            },
            requiresConfirmation: true,
          }
        : undefined,
    );
  }

  const lead = input.lead;
  if (lead) {
    if (lead.pipelineStatus === "new" && lead.daysSinceTouch >= 1 && lead.daysSinceTouch < 3) {
      push(
        out,
        "ACTION",
        "Follow up within 24h — lead still in new stage.",
        "HIGH",
        maxItems,
        ck,
        lid
          ? {
              actionType: "SEND_FOLLOWUP",
              payload: { leadId: lid },
              requiresConfirmation: true,
            }
          : undefined,
      );
    }
    if (lead.highIntent && lead.daysSinceTouch >= 2) {
      push(
        out,
        "ACTION",
        "High-intent lead cooling — prioritize a call or visit request.",
        "HIGH",
        maxItems,
        ck,
        lid
          ? {
              actionType: "SCHEDULE_VISIT",
              payload: { leadId: lid },
              requiresConfirmation: true,
            }
          : undefined,
      );
    }
    if (lead.score >= 75 && lead.pipelineStatus === "new") {
      push(
        out,
        "ACTION",
        "Strong fit score — propose next step (visit or offer prep) when appropriate.",
        "MEDIUM",
        maxItems,
        ck,
        lid
          ? {
              actionType: "SEND_SIMILAR_LISTINGS",
              payload: { leadId: lid },
              requiresConfirmation: true,
            }
          : undefined,
      );
    }
    if (lead.daysSinceTouch >= 7) {
      push(
        out,
        "ALERT",
        "Lead idle 7+ days — re-engage or update stage to keep pipeline truthful.",
        "MEDIUM",
        maxItems,
        ck,
        lid
          ? {
              actionType: "SEND_FOLLOWUP",
              payload: { leadId: lid },
              requiresConfirmation: true,
            }
          : undefined,
      );
    }
  }

  const deal = input.deal;
  if (deal) {
    const status = deal.status.toLowerCase();
    if (["initiated", "offer_submitted"].includes(status) && deal.daysSinceTouch >= 5) {
      push(out, "ACTION", "Deal quiet 5+ days in early stage — align buyer/seller expectations.", "MEDIUM", maxItems, ck);
    }
    if (["inspection", "financing", "closing_scheduled"].includes(status) && deal.daysSinceTouch >= 3) {
      push(
        out,
        "REMINDER",
        "Mid-pipeline file — confirm milestones and document checklist with parties.",
        "MEDIUM",
        maxItems,
        ck,
      );
    }
    if (status === "offer_submitted") {
      push(
        out,
        "ACTION",
        "Offer on file — review negotiation posture (you control outreach).",
        "MEDIUM",
        maxItems,
        ck,
        did
          ? {
              actionType: "REQUEST_OFFER_UPDATE",
              payload: { dealId: did },
              requiresConfirmation: true,
            }
          : undefined,
      );
    }
  }

  if (out.length === 0) {
    push(
      out,
      "REMINDER",
      "Stay proactive: confirm next touchpoints & update CRM notes after each client interaction.",
      "LOW",
      maxItems,
      ck,
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
