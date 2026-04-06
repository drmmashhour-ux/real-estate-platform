import { parseSearchIntent, type ParsedSearchIntent } from "@/lib/ai/parseSearchIntent";

export type AssistantIntentKind =
  | "property_search"
  | "stay_search"
  | "compare_listings"
  | "listing_explainer"
  | "booking_help"
  | "unlock_help"
  | "broker_help"
  | "mortgage_help"
  | "host_help"
  | "general_platform_help"
  | "unsupported";

export type AssistantPageContext = {
  pathname: string;
  listingId?: string;
  stayId?: string;
  /** Optional snapshot when page passes it */
  listingTitle?: string;
  listingPriceLabel?: string;
  listingCity?: string;
  compareListingIds?: [string, string];
};

export type AssistantRouteResult = {
  intent: AssistantIntentKind;
  confidence: number;
  entities: {
    search?: ParsedSearchIntent;
    helpTopic?: string;
  };
  nextAction: "search_navigate" | "stay_navigate" | "respond_only" | "compare" | "none";
};

function scoreHelp(q: string, patterns: RegExp[]): number {
  return patterns.some((p) => p.test(q)) ? 0.88 : 0;
}

/**
 * Classify user message + light context for the platform assistant (heuristics).
 */
export function routeAssistantIntent(message: string, context: AssistantPageContext): AssistantRouteResult {
  const q = message.trim();
  const lower = q.toLowerCase();

  if (!q) {
    return { intent: "unsupported", confidence: 0, entities: {}, nextAction: "none" };
  }

  // Compare — full diff when two ids are in context (e.g. future compare tray)
  if (/\bcompare\b|\bwhich (?:one )?is better\b|\bwhat(?:'s| is) the difference\b|\bvs\.?\b/i.test(q)) {
    const hasPair = context.compareListingIds?.length === 2;
    return {
      intent: "compare_listings",
      confidence: hasPair ? 0.8 : 0.65,
      entities: {},
      nextAction: hasPair ? "compare" : "respond_only",
    };
  }

  // Help intents (before search to catch "how do I book")
  if (scoreHelp(lower, [/\bbook(?:ing)?\b.*\b(?:stay|bnhub|room)\b/i, /\bhow do i book\b/i])) {
    return { intent: "booking_help", confidence: 0.9, entities: { helpTopic: "booking" }, nextAction: "respond_only" };
  }
  if (scoreHelp(lower, [/\bunlock\b.*\bcontact\b/i, /\bowner contact\b/i, /\bhow.*unlock\b/i])) {
    return { intent: "unlock_help", confidence: 0.88, entities: { helpTopic: "unlock" }, nextAction: "respond_only" };
  }
  if (/\b(?:broker|agent)\b/i.test(lower) && /\bhow\b/i.test(lower)) {
    return { intent: "broker_help", confidence: 0.85, entities: {}, nextAction: "respond_only" };
  }
  if (/\bmortgage\b/i.test(lower) && /\bhow\b/i.test(lower)) {
    return { intent: "mortgage_help", confidence: 0.85, entities: {}, nextAction: "respond_only" };
  }
  if (/\bhost\b/i.test(lower) && /\b(?:list|property|rent)\b/i.test(lower)) {
    return { intent: "host_help", confidence: 0.82, entities: {}, nextAction: "respond_only" };
  }

  // Listing explainer on listing pages
  if (
    context.listingId &&
    /\b(?:explain|tell me about|this (?:listing|property)|good deal|key features)\b/i.test(q)
  ) {
    return { intent: "listing_explainer", confidence: 0.8, entities: {}, nextAction: "respond_only" };
  }
  if (
    context.stayId &&
    /\b(?:explain|this stay|pricing|check[- ]?in)\b/i.test(q) &&
    !/\bfind\b|\bsearch\b/i.test(q)
  ) {
    return { intent: "listing_explainer", confidence: 0.78, entities: {}, nextAction: "respond_only" };
  }

  const search = parseSearchIntent(q);
  if (search.category === "stay") {
    return {
      intent: "stay_search",
      confidence: 0.82,
      entities: { search },
      nextAction: "stay_navigate",
    };
  }
  if (search.category === "sale" || search.category === "rent" || search.category === "commercial") {
    return {
      intent: "property_search",
      confidence: 0.8,
      entities: { search },
      nextAction: "search_navigate",
    };
  }

  if (/\b(?:how|what|where|why)\b/i.test(q) || /\bhelp\b/i.test(q)) {
    return { intent: "general_platform_help", confidence: 0.65, entities: {}, nextAction: "respond_only" };
  }

  if (/\b(?:find|search|show|looking for)\b/i.test(q)) {
    const s = parseSearchIntent(q);
    return {
      intent: s.category === "unknown" ? "general_platform_help" : "property_search",
      confidence: 0.55,
      entities: { search: s },
      nextAction: s.category === "stay" ? "stay_navigate" : "search_navigate",
    };
  }

  return { intent: "unsupported", confidence: 0.4, entities: { search: parseSearchIntent(q) }, nextAction: "respond_only" };
}
