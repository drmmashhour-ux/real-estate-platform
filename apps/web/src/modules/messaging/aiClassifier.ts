/**
 * Rule-based classifier for growth AI auto-reply (no LLM).
 *
 * Rollout phases (ops):
 * - Phase A (default): simple interest, hesitation, trust, timing — keep `AI_AUTO_REPLY_INCLUDE_PRICE` unset so
 *   price-like lines route to uncertainty copy, not dedicated price templates.
 * - Phase B: set `AI_AUTO_REPLY_INCLUDE_PRICE=1` after logs look good.
 * - Phase C: silent nudge worker, stronger scoring, broker/host branches, A/B templates (see worker + seed).
 */

export type AiIntent =
  | "buyer_interest"
  | "booking_interest"
  | "broker_interest"
  | "host_interest"
  | "support_issue"
  | "unclear";

export type AiObjection = "price" | "trust" | "timing" | "uncertainty" | "none";

export type AiUrgency = "low" | "medium" | "high";

export type AiFlowHint = "buyer" | "booking" | "broker" | "host" | "unknown";

export type AiClassifierContext = {
  flowHint?: AiFlowHint;
  /** Recent inbound user texts in this thread (oldest first), excluding the current message. */
  priorUserTexts?: string[];
  lastEventTypes?: string[];
  /** True if user recently hit checkout / booking start (events or conversation context). */
  checkoutStarted?: boolean;
  /** True if user recently viewed or inquired on a listing (events or context). */
  listingRecentlyViewed?: boolean;
  /** Set from conversation context when an inquiry was just attributed to this thread. */
  inquirySent?: boolean;
  /** Many listing views in a short window (from user events). */
  repeatedListingInterest?: boolean;
  /** Thread already has at least one AI outbound. */
  threadHasAiReply?: boolean;
  /** Human has taken over the thread. */
  humanTakeover?: boolean;
  /** Count of prior user lines that had a detected objection (from DB), optional. */
  priorObjectionMessageCount?: number;
};

const LEGAL_THREAT_PATTERN =
  /\b(lawsuit|sue\b|suing|attorney|lawyer|legal action|subpoena|police report|small claims)\b/i;

const PAYMENT_TRUST_COMBO =
  /\b(payment|pay|paid|charge|card|stripe|refund|money)\b.*\b(trust|safe|scam|fraud|secure|legit)\b|\b(trust|safe|scam|fraud)\b.*\b(payment|pay|paid|charge|card)\b/i;

export function detectHighIntent(messageText: string, context: AiClassifierContext): boolean {
  const text = messageText.toLowerCase();

  if (
    /\bcan i book\b/.test(text) ||
    text.includes("book") ||
    /\bis it available\b/.test(text) ||
    text.includes("available") ||
    text.includes("availability") ||
    text.includes("schedule") ||
    text.includes("visit") ||
    text.includes("call me") ||
    text.includes("send link") ||
    text.includes("how do i proceed") ||
    text.includes("next step") ||
    text.includes("how much exactly") ||
    text.includes("price breakdown") ||
    text.includes("how much") ||
    /\bcan a broker call\b/.test(text) ||
    /\bi want this\b/.test(text) ||
    (/\bi'?m interested\b/.test(text) && !/\bnot sure\b|\bunsure\b|hesitat/i.test(text)) ||
    /\bwhere do i pay\b/.test(text) ||
    /\bdetails?\b/.test(text) ||
    text.includes("more detail") ||
    /can i visit|can we visit|could i visit|tour|showing/i.test(text) ||
    /\bwhen (can|could|are|is|do|would|will)\b/i.test(text)
  )
    return true;

  if (context?.checkoutStarted) return true;
  if (context?.inquirySent) return true;

  if (context?.repeatedListingInterest && (context.listingRecentlyViewed || context.flowHint === "buyer")) {
    return true;
  }

  if (
    context?.threadHasAiReply &&
    (context.flowHint === "booking" || context.checkoutStarted) &&
    (context.priorUserTexts?.length ?? 0) >= 1
  ) {
    return true;
  }

  return false;
}

const CONFIDENCE_BASE = 0.55;

// ---------------------------------------------------------------------------
// Priority 1 — payment / billing → always human (never auto-resolve)
// ---------------------------------------------------------------------------
export const PAYMENT_HANDOFF_PATTERN =
  /\b(refund|chargeback|charged twice|double charged|double charge|payment failed|card declined|wrong charge|unauthorized charge|dispute|money back|was charged|got charged|you charged me|i was charged)\b/i;

export function requiresPaymentHandoff(messageText: string): boolean {
  return PAYMENT_HANDOFF_PATTERN.test(normalize(messageText));
}

function normalize(t: string) {
  return t.toLowerCase().trim();
}

/** Heuristic urgency from wording (no LLM). */
export function detectUrgency(messageText: string): AiUrgency {
  const t = normalize(messageText);
  if (/asap|urgent|today|right now|immediately|need it now|book now|reserve now|lock it in/i.test(t)) return "high";
  if (/\b(call me|phone me|ring me|text me|give me a call|visit|showing|tour)\b/i.test(t)) return "medium";
  if (/soon|this week|tomorrow|quickly/i.test(t)) return "medium";
  return "low";
}

export function detectObjection(messageText: string): AiObjection {
  const t = normalize(messageText);
  if (PAYMENT_HANDOFF_PATTERN.test(t)) {
    return "trust";
  }
  if (/scam|fraud|fake|trust|safe|legit|secure|rip-?off|sketchy/i.test(t)) return "trust";
  if (/expensive|too much|costly|price|cost|budget|overpriced|cheaper|compare.*price/i.test(t)) return "price";
  if (/later|not now|busy|next week|bad timing|tomorrow|in a few days/i.test(t)) return "timing";
  if (
    /\bidk\b|not sure|unsure|hesitat|unclear|confus|don't understand|do not understand|thinking|think about/i.test(t)
  ) {
    return "uncertainty";
  }
  return "none";
}

/** True when the line reads as uncertainty/hesitation (excludes payment lines). */
export function messageSuggestsUncertainty(text: string): boolean {
  if (requiresPaymentHandoff(text)) return false;
  return detectObjection(text) === "uncertainty";
}

export function detectIntent(messageText: string, ctx: AiClassifierContext = {}): AiIntent {
  const t = normalize(messageText);
  const hint = ctx.flowHint ?? "unknown";

  if (requiresPaymentHandoff(messageText)) {
    return "support_issue";
  }

  const sawListing =
    ctx.listingRecentlyViewed ||
    ctx.lastEventTypes?.includes("LISTING_VIEW") ||
    ctx.lastEventTypes?.includes("INQUIRY") ||
    ctx.lastEventTypes?.includes("FAVORITE");

  // Availability questions after listing interest → high intent (not generic unclear)
  if (
    /\b(is it |still )?available\b|\bstill on the market\b|\bany availability\b|\bopen for (these )?dates\b|\bdates (still )?open\b/i.test(
      t
    )
  ) {
    if (hint === "booking" || ctx.checkoutStarted) return "booking_interest";
    if (sawListing || hint === "buyer") return "buyer_interest";
    return "buyer_interest";
  }

  if (
    /\b(host|list my (place|property|unit)|airbnb|short[- ]term rental|calendar sync)\b/i.test(t) ||
    (hint === "host" && /list|property|rental/i.test(t))
  ) {
    return "host_interest";
  }

  if (/\b(can (a )?broker call|have a broker call|get a broker to call)\b/i.test(t)) {
    return "buyer_interest";
  }

  if (
    /\b(broker|oaciq|commission|leads|crm|my buyers)\b/i.test(t) ||
    (hint === "broker" && /onboard|platform|lead/i.test(t))
  ) {
    return "broker_interest";
  }

  if (
    /\b(book|booking|stay|check[- ]?in|check[- ]?out|nights|guest|cancellation|bnb|airbnb)\b/i.test(t) ||
    hint === "booking"
  ) {
    return "booking_interest";
  }

  if (
    /\b(condo|house|duplex|visit|showing|mortgage|offer|buy|purchase|listing|lecipm|inquir)\b/i.test(t) ||
    hint === "buyer" ||
    sawListing
  ) {
    return "buyer_interest";
  }

  if (t.length < 6) return "unclear";

  return "unclear";
}

export type HandoffCheck = {
  handoff: boolean;
  reason?: string;
};

const AGGRESSIVE = /\b(stupid|idiot|hate you|garbage|useless|screw you|fuck|shit\b|lawsuit|lawyer)\b/i;

export function shouldHandoff(messageText: string, ctx: AiClassifierContext & { confidence?: number }): HandoffCheck {
  const t = normalize(messageText);

  if (requiresPaymentHandoff(messageText)) {
    return { handoff: true, reason: "payment_or_refund" };
  }

  if (LEGAL_THREAT_PATTERN.test(t)) {
    return { handoff: true, reason: "legal_or_sensitive" };
  }

  if (PAYMENT_TRUST_COMBO.test(t) && /\b(payment|pay|paid|charge|card|refund)\b/i.test(t)) {
    return { handoff: true, reason: "payment_trust_sensitive" };
  }

  if (AGGRESSIVE.test(t)) {
    return { handoff: true, reason: "aggressive_tone" };
  }

  const prior = ctx.priorUserTexts ?? [];
  const lastPrior = prior[prior.length - 1];
  if (lastPrior && messageSuggestsUncertainty(lastPrior) && messageSuggestsUncertainty(messageText)) {
    return { handoff: true, reason: "repeated_uncertainty" };
  }

  if ((ctx.confidence ?? 1) < 0.35) {
    return { handoff: true, reason: "low_confidence" };
  }

  const confusionHits =
    (ctx.priorUserTexts ?? []).filter((p) =>
      /don't understand|do not understand|still confused|makes no sense|not clear|doesn't work/i.test(p)
    ).length + (/\b(still|again)\b.*\b(confus|unclear|don't understand|not working)\b/i.test(t) ? 1 : 0);

  if (confusionHits >= 2) {
    return { handoff: true, reason: "repeated_confusion" };
  }

  if (
    /\b(talk to (a )?human|real person|speak to someone|call me now|broker call me|can a broker call)\b/i.test(t)
  ) {
    return { handoff: true, reason: "explicit_human_request" };
  }

  return { handoff: false };
}

/** Full classifier output (camelCase + legacy snake_case for existing call sites). */
export type ClassifyInboundResult = {
  detectedIntent: AiIntent;
  detectedObjection: AiObjection;
  urgency: AiUrgency;
  highIntent: boolean;
  confidence: number;
  handoffRequired: boolean;
  handoffReason?: string;
  detected_intent: AiIntent;
  detected_objection: AiObjection;
  high_intent: boolean;
  handoff: HandoffCheck;
};

export function classifyInbound(messageText: string, ctx: AiClassifierContext = {}): ClassifyInboundResult {
  if (requiresPaymentHandoff(messageText)) {
    const hi = detectHighIntent(messageText, ctx);
    const handoff: HandoffCheck = { handoff: true, reason: "payment_or_refund" };
    return {
      detectedIntent: "support_issue",
      detectedObjection: "trust",
      confidence: 0.95,
      urgency: detectUrgency(messageText),
      highIntent: hi,
      handoffRequired: true,
      handoffReason: "payment_or_refund",
      detected_intent: "support_issue",
      detected_objection: "trust",
      high_intent: hi,
      handoff,
    };
  }

  const intent = detectIntent(messageText, ctx);
  const objection = detectObjection(messageText);
  let confidence = CONFIDENCE_BASE;

  if (intent !== "unclear") confidence += 0.15;
  if (objection !== "none") confidence += 0.12;
  if (ctx.flowHint && ctx.flowHint !== "unknown") confidence += 0.08;
  if (messageText.trim().length > 25) confidence += 0.05;
  if (/\b(is it |still )?available\b|\bstill on the market\b/i.test(normalize(messageText))) confidence += 0.08;
  if (ctx.repeatedListingInterest) confidence += 0.04;
  if (ctx.threadHasAiReply) confidence += 0.03;

  const high_intent = detectHighIntent(messageText, ctx);
  if (high_intent) confidence += 0.1;

  confidence = Math.min(0.95, Math.max(0.2, confidence));

  const handoff = shouldHandoff(messageText, { ...ctx, confidence });
  const handoffRequired = handoff.handoff || intent === "support_issue";

  return {
    detectedIntent: intent,
    detectedObjection: objection,
    urgency: detectUrgency(messageText),
    highIntent: high_intent,
    confidence,
    handoffRequired,
    handoffReason: handoff.reason,
    detected_intent: intent,
    detected_objection: objection,
    high_intent,
    handoff,
  };
}
