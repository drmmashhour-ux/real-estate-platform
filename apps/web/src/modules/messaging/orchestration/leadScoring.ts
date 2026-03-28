import type { AiClassifierContext, AiFlowHint, ClassifyInboundResult } from "@/src/modules/messaging/aiClassifier";

export type RouteType = "buyer" | "booking" | "broker_recruitment" | "host_recruitment" | "support";

export type ConversionGoal = "inquiry" | "call" | "visit" | "booking" | "onboarding";

export type OrchestrationScoringInput = {
  classified: Pick<
    ClassifyInboundResult,
    "detectedIntent" | "detectedObjection" | "highIntent" | "handoffRequired" | "confidence" | "urgency"
  >;
  classifierCtx: AiClassifierContext;
  lastUserMessageText: string;
  conversationOutcome: string | null;
  stage: string;
  userMessageCount: number;
};

const URGENCY_WORDS = /\b(today|tonight|now|asap|urgent|immediately|right away|this week)\b/i;
const CALL_WORDS = /\b(call me|phone|arrange a call|schedule a call|speak to someone)\b/i;
const AVAIL_WORDS = /\b(available|availability|open dates|is it free)\b/i;
const NEXT_STEP_WORDS = /\b(next step|how do i proceed|move forward|book|reserve)\b/i;
const PRICE_DETAIL = /\b(price breakdown|how much exactly|total cost|fees)\b/i;

export function determineRouteType(intent: string, flowHint: AiFlowHint | undefined): RouteType {
  if (intent === "support_issue") return "support";
  if (intent === "broker_interest") return "broker_recruitment";
  if (intent === "host_interest") return "host_recruitment";
  if (intent === "booking_interest" || flowHint === "booking") return "booking";
  return "buyer";
}

export function computeLeadScore(input: OrchestrationScoringInput): number {
  let s = 0;
  const { classified, classifierCtx, lastUserMessageText, conversationOutcome, stage, userMessageCount } = input;
  const t = lastUserMessageText.toLowerCase();

  if (classified.handoffRequired) {
    return Math.max(0, Math.min(3, URGENCY_WORDS.test(t) ? 2 : 1));
  }

  if (classifierCtx.inquirySent || conversationOutcome === "qualified") s += 2;
  if (classifierCtx.checkoutStarted) s += 2;
  if (classified.highIntent) s += 2;
  if (classifierCtx.repeatedListingInterest) s += 1;
  if (CALL_WORDS.test(t) || classified.highIntent) s += 1;
  if (AVAIL_WORDS.test(t)) s += 1;
  if (NEXT_STEP_WORDS.test(t)) s += 1;
  if (PRICE_DETAIL.test(t)) s += 1;
  if (userMessageCount >= 3 && classifierCtx.threadHasAiReply) s += 1;

  if (conversationOutcome === "booked" || conversationOutcome === "call_scheduled") s += 3;

  if (intentOnlyBrowsing(classified.detectedIntent, classifierCtx)) s -= 2;
  if (classified.detectedObjection === "uncertainty" && (classifierCtx.priorObjectionMessageCount ?? 0) >= 2) s -= 1;
  if (stage === "stale") s -= 2;

  return Math.max(0, Math.min(12, s));
}

function intentOnlyBrowsing(intent: string, ctx: AiClassifierContext): boolean {
  if (intent === "unclear" && !ctx.inquirySent && !ctx.checkoutStarted) return true;
  return false;
}

export function computeUrgencyScore(input: OrchestrationScoringInput): number {
  let u = 0;
  const t = input.lastUserMessageText.toLowerCase();
  if (URGENCY_WORDS.test(t)) u += 2;
  if (input.classifierCtx.checkoutStarted) u += 2;
  if (input.classified.highIntent) u += 1;
  if (input.classified.urgency === "high") u += 2;
  else if (input.classified.urgency === "medium") u += 1;
  if (/\b(soon|quickly|before it'?s gone|don'?t want to lose)\b/i.test(t)) u += 1;
  if (input.userMessageCount >= 3) u += 1;
  return Math.max(0, Math.min(8, u));
}

export function computeConversionGoal(route: RouteType, lastUserMessageText: string): ConversionGoal | null {
  const t = lastUserMessageText.toLowerCase();
  switch (route) {
    case "buyer":
      if (/\bvisit|tour|showing\b/i.test(t)) return "visit";
      return "call";
    case "booking":
      return "booking";
    case "broker_recruitment":
    case "host_recruitment":
      return "onboarding";
    case "support":
      return "inquiry";
    default:
      return "inquiry";
  }
}
