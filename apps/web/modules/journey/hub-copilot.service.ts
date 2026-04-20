import { bumpJourneyMetric, logJourneyStructuredKind } from "./hub-journey-monitoring.service";
import { buildHubJourneyPlan } from "./hub-journey-state.service";
import type {
  HubCopilotState,
  HubCopilotSuggestion,
  HubJourneyContext,
  HubJourneyPlan,
  HubJourneySignalConfidence,
  HubKey,
} from "./hub-journey.types";

function softenCopilotExplanation(confidence: JourneyConfidence | undefined, explanation: string): string {
  if (confidence !== "low") return explanation;
  return `${explanation} Limited signals in this session — confirm details in the product before acting.`;
}

function softenSuggestedAction(confidence: JourneyConfidence | undefined, action: string): string {
  if (confidence !== "low") return action;
  if (/^(consider|you might|optional)/i.test(action.trim())) return action;
  return `Consider: ${action.charAt(0).toLowerCase()}${action.slice(1)}`;
}

function suggestion(
  hub: HubKey,
  id: string,
  priority: HubCopilotSuggestion["priority"],
  title: string,
  explanation: string,
  suggestedAction: string,
  route: string | undefined,
  basedOn: string[],
): HubCopilotSuggestion {
  return {
    id,
    hub,
    priority,
    title,
    explanation,
    suggestedAction,
    route,
    basedOn,
  };
}

/**
 * Explainable next-step suggestions (1–3). Does not mutate inputs. No network I/O.
 */
export function buildHubCopilotState(
  hub: HubKey,
  ctx: HubJourneyContext,
  existingPlan?: HubJourneyPlan,
): HubCopilotState {
  try {
    bumpJourneyMetric("copilotStatesBuilt");
  } catch {
    /* noop */
  }

  const plan = existingPlan ?? buildHubJourneyPlan(hub, ctx);
  const createdAt = plan.createdAt;
  const current = plan.steps.find((s) => s.id === plan.currentStepId);
  const next = plan.steps.find((s) => s.id === plan.nextStepId);
  const blockers = plan.steps.find((s) => s.blockers?.length)?.blockers ?? [];

  const suggestions: HubCopilotSuggestion[] = [];

  const push = (s: HubCopilotSuggestion) => {
    if (suggestions.length < 3) suggestions.push(s);
  };

  switch (hub) {
    case "buyer":
      if ((ctx.buyerShortlistCount ?? 0) > 0 && !ctx.buyerContactedSeller) {
        push(
          suggestion(
            hub,
            "buy-shortlist-contact",
            "high",
            "Contact your strongest saved listing",
            "Shortlists only create value when you start conversations.",
            "Open the listing and send a focused question or tour request.",
            current?.route,
            ["saved_listings", "contact_logs"],
          ),
        );
      }
      if (!ctx.buyerCitySelected) {
        push(
          suggestion(
            hub,
            "buy-city",
            "high",
            "Set your primary city",
            "Search and alerts stay accurate when your market is explicit.",
            "Update profile home city or run a city-scoped search.",
            current?.route,
            ["profile_city"],
          ),
        );
      }
      break;
    case "broker":
      if ((ctx.brokerLeadsUnlocked ?? 0) > 0 && (ctx.brokerLeadsContacted ?? 0) === 0) {
        push(
          suggestion(
            hub,
            "brk-touch",
            "high",
            "Touch unlocked leads within minutes",
            "Speed correlates with conversion on paid unlocks.",
            "Open the lead and log a first touch in your CRM.",
            current?.route,
            ["unlocked_leads", "follow_up"],
          ),
        );
      }
      break;
    case "bnhub_host":
      if (ctx.bnHostPublished && ctx.bnHostLowConversion) {
        push(
          suggestion(
            hub,
            "host-quality",
            "medium",
            "Strengthen photos and amenities",
            "Weak media or sparse amenities reduce trust before price is even seen.",
            "Add 6+ photos and tag amenities guests filter on.",
            current?.route,
            ["listing_signals", "conversion"],
          ),
        );
      }
      break;
    default:
      break;
  }

  if (blockers.length > 0) {
    push(
      suggestion(
        hub,
        `${hub}-blocker-1`,
        "high",
        "Resolve the highlighted blocker",
        blockers[0] ?? "Complete the blocking item to unlock the next milestone.",
        "Review the checklist item and update your listing or profile.",
        current?.route,
        ["blockers"],
      ),
    );
  }

  if (suggestions.length === 0 && next) {
    push(
      suggestion(
        hub,
        `${hub}-next-default`,
        "medium",
        `Next: ${next.title}`,
        next.why,
        next.actionLabel ?? "Continue",
        next.route,
        ["journey_plan"],
      ),
    );
  }

  if (suggestions.length === 0 && current) {
    push(
      suggestion(
        hub,
        `${hub}-current`,
        "low",
        `Focus: ${current.title}`,
        current.why,
        current.actionLabel ?? "Open step",
        current.route,
        ["journey_plan"],
      ),
    );
  }

  try {
    bumpJourneyMetric("suggestionsGenerated", suggestions.length);
  } catch {
    /* noop */
  }

  const capped = suggestions.slice(0, 3);
  const confidence = plan.confidence;
  const softened = capped.map((s) => ({
    ...s,
    explanation: softenCopilotExplanation(confidence, s.explanation),
    suggestedAction: softenSuggestedAction(confidence, s.suggestedAction),
  }));

  try {
    if (softened.length > 0) {
      logJourneyStructuredKind("copilot_suggestions_generated", {
        hub,
        confidence,
        suggestionCount: softened.length,
        suggestionIds: softened.map((s) => s.id),
      });
    }
  } catch {
    /* noop */
  }

  return {
    hub,
    currentStepTitle: current?.title,
    nextStepTitle: next?.title,
    suggestions: softened,
    blockers,
    confidence,
    createdAt,
  };
}
