/**
 * Deal Assistant — assisted AI for operators (heuristic analysis, not full automation).
 * Suggestions require human review before send.
 */

export type DealAssistantIntent = "browsing" | "serious" | "ready_to_buy";

export type DealAssistantObjection = "price" | "trust" | "hesitation" | "none";

export type DealAssistantUrgency = "low" | "medium" | "high";

/** What the operator should consider doing next (human executes). */
export type DealAssistantRecommendedAction = "send_message" | "push_booking" | "assign_broker" | "wait";

export type ConversationMessageInput = {
  senderType: string;
  messageText: string;
  createdAt?: Date | string;
};

export type DealAssistantAnalysis = {
  detectedIntent: DealAssistantIntent;
  detectedObjection: DealAssistantObjection;
  urgencyLevel: DealAssistantUrgency;
  recommendedAction: DealAssistantRecommendedAction;
  messageSuggestion: string;
  confidence: number;
};

/** Optional marketplace memory hints — assistive only; never overrides explicit user messages. */
export type DealAssistantMemoryHints = {
  urgencyScore?: number;
  activeVsPassive?: string;
};

const norm = (s: string) => s.trim().toLowerCase();

function userTexts(messages: ConversationMessageInput[]): string[] {
  return messages.filter((m) => m.senderType === "user").map((m) => norm(m.messageText));
}

function lastUserMessageAt(messages: ConversationMessageInput[]): Date | null {
  const userMsgs = messages.filter((m) => m.senderType === "user");
  if (userMsgs.length === 0) return null;
  const last = userMsgs[userMsgs.length - 1];
  if (!last.createdAt) return null;
  return typeof last.createdAt === "string" ? new Date(last.createdAt) : last.createdAt;
}

function scoreIntent(texts: string[]): { intent: DealAssistantIntent; weight: number } {
  const blob = texts.join(" ");
  let ready = 0;
  let serious = 0;
  let browse = 0;

  const readySignals = /\b(ready to|let'?s do it|book (a |an |the )?|schedule|sign|deposit|make an offer|confirm|lock (it|this)|buy (it|this|now)|close the deal)\b/i;
  const seriousSignals =
    /\b(when can|availability|financ(e|ing)|mortgage|pre-approval|visit|showing|tour|see (the )?place|how much|details|move-in|closing date)\b/i;
  const browseSignals = /\b(just (looking|browsing)|maybe later|not sure yet|curious|no rush|someday|thinking about it)\b/i;

  for (const t of texts) {
    if (readySignals.test(t)) ready += 2;
    if (seriousSignals.test(t)) serious += 1;
    if (browseSignals.test(t)) browse += 1;
  }
  if (readySignals.test(blob)) ready += 1;
  if (seriousSignals.test(blob)) serious += 1;
  if (browseSignals.test(blob)) browse += 1;

  if (ready >= 2 || (ready >= 1 && serious >= 1)) return { intent: "ready_to_buy", weight: Math.min(0.95, 0.55 + ready * 0.12) };
  if (serious >= 2 || (serious >= 1 && browse === 0)) return { intent: "serious", weight: Math.min(0.88, 0.5 + serious * 0.1) };
  if (browse > serious && browse > 0) return { intent: "browsing", weight: Math.min(0.82, 0.45 + browse * 0.1) };
  if (serious > 0) return { intent: "serious", weight: 0.55 };
  if (texts.some((t) => t.length > 80)) return { intent: "serious", weight: 0.48 };
  return { intent: "browsing", weight: texts.length > 0 ? 0.42 : 0.35 };
}

function scoreObjection(texts: string[]): { objection: DealAssistantObjection; weight: number } {
  const blob = texts.join(" ");
  let price = 0;
  let trust = 0;
  let hesitation = 0;

  const priceRe = /\b(too expensive|overpriced|price|budget|cheaper|negotiat|afford|cost(s)?|fee(s)?|commission)\b/i;
  const trustRe = /\b(scam|trust|legit|verify|proof|worried|risk|safe|real company)\b/i;
  const hesRe =
    /\b(not sure|hesitat|think about|need to (talk|discuss)|spouse|partner|sleep on|later|maybe|idk|don'?t know)\b/i;

  for (const t of texts) {
    if (priceRe.test(t)) price += 1;
    if (trustRe.test(t)) trust += 1;
    if (hesRe.test(t)) hesitation += 1;
  }
  if (priceRe.test(blob)) price += 1;
  if (trustRe.test(blob)) trust += 1;
  if (hesRe.test(blob)) hesitation += 1;

  if (trust >= price && trust >= hesitation && trust > 0) return { objection: "trust", weight: 0.55 + trust * 0.1 };
  if (price >= hesitation && price > 0) return { objection: "price", weight: 0.52 + price * 0.1 };
  if (hesitation > 0) return { objection: "hesitation", weight: 0.5 + hesitation * 0.08 };
  return { objection: "none", weight: 0.4 };
}

function scoreUrgency(messages: ConversationMessageInput[], intent: DealAssistantIntent): DealAssistantUrgency {
  const lastAt = lastUserMessageAt(messages);
  const now = Date.now();
  const hoursSince = lastAt ? (now - lastAt.getTime()) / (1000 * 3600) : 999;

  if (intent === "ready_to_buy" && hoursSince < 6) return "high";
  if (hoursSince < 2) return "high";
  if (hoursSince < 24 || intent === "serious") return "medium";
  return "low";
}

function buildMessageSuggestion(
  intent: DealAssistantIntent,
  objection: DealAssistantObjection,
  urgency: DealAssistantUrgency
): string {
  if (objection === "hesitation") {
    return "Totally understand wanting to be sure — there's no pressure. I'm here to answer anything that would help you feel confident. What's the one thing that would make this an easy yes for you?";
  }
  if (objection === "price") {
    return "Price is important, and I want you to feel the value lines up. Happy to walk through what's included, how this compares to similar homes in the area, and options that could work for your budget. Would a quick 10-minute call help?";
  }
  if (objection === "trust") {
    return "Happy to share how we work, references, and anything that helps you feel comfortable. We can also connect you with a licensed broker on our team if you'd like a second voice — whatever makes this feel straightforward for you.";
  }
  if (intent === "ready_to_buy" || (intent === "serious" && urgency === "high")) {
    return "Great momentum. The next easy step is to pick a time that works for you — I can hold a short visit or a quick call to lock details. Which day works best this week?";
  }
  if (intent === "serious") {
    return "Thanks for the detail — that helps. I can pull a few concrete next steps (availability, comparable context, or a short call). What would be most useful right now?";
  }
  return "Thanks for reaching out. I'm here when you're ready to go deeper — happy to share listings that match what you described or answer questions at your pace.";
}

function pickAction(
  intent: DealAssistantIntent,
  objection: DealAssistantObjection,
  urgency: DealAssistantUrgency
): DealAssistantRecommendedAction {
  if (objection === "trust") return "assign_broker";
  if (intent === "ready_to_buy" || (intent === "serious" && urgency === "high")) return "push_booking";
  if (objection === "none" && intent === "browsing" && urgency === "low") return "wait";
  return "send_message";
}

function bumpUrgencyWithMemory(
  urgency: DealAssistantUrgency,
  hints?: DealAssistantMemoryHints | null,
): DealAssistantUrgency {
  if (!hints) return urgency;
  const score = hints.urgencyScore ?? 0;
  const active = hints.activeVsPassive === "active";
  if (!active && score < 40) return urgency;
  if (urgency === "low" && (active || score >= 40)) return "medium";
  if (urgency === "medium" && score >= 65) return "high";
  return urgency;
}

/**
 * Analyze a thread for operator assistance. Uses keyword/heuristic signals only (no external LLM).
 */
export function analyzeConversation(
  messages: ConversationMessageInput[],
  opts?: { marketplaceMemoryHints?: DealAssistantMemoryHints | null },
): DealAssistantAnalysis {
  const texts = userTexts(messages);
  const { intent, weight: iw } = scoreIntent(texts);
  const { objection, weight: ow } = scoreObjection(texts);
  let urgency = scoreUrgency(messages, intent);
  urgency = bumpUrgencyWithMemory(urgency, opts?.marketplaceMemoryHints ?? null);
  const messageSuggestion = buildMessageSuggestion(intent, objection, urgency);
  const recommendedAction = pickAction(intent, objection, urgency);
  const confidence = Math.min(0.95, Math.max(0.35, (iw + ow) / 2));

  return {
    detectedIntent: intent,
    detectedObjection: objection,
    urgencyLevel: urgency,
    recommendedAction,
    messageSuggestion,
    confidence: Math.round(confidence * 100) / 100,
  };
}
