/**
 * AI client communication — Quebec real-estate context, rule-based qualification.
 * NOT a licensed broker; no legal, tax, or personalized financial advice; no price negotiation.
 */

import type { LeadTier } from "./lead-tier";
import { classifyInboundSafety } from "./follow-up/safety";

/** Shown on every substantive assistant turn (compliance). */
export const QUEBEC_BROKERAGE_NOTICE =
  "In Québec, real estate brokerage is a regulated activity. I am a digital assistant only — not a licensed courtier immobilier or lawyer. I cannot negotiate price, draft clauses, or give legal or tax advice. Only a licensed courtier (or other qualified professional) can do that; they are subject to OACIQ rules.";

export const CLIENT_CHAT_DISCLAIMER = `${QUEBEC_BROKERAGE_NOTICE}\n\nI share general information only. Always confirm material facts with a licensed professional.`;

const LEGAL_FINANCIAL_ESCALATION =
  /\b(lawyer|attorney|notaire|notary|legal advice|sue|litigation|contract review|title (issue|defect)|easement|zoning law|tax advice|revenu québec|cpa|irs|mortgage rate lock|apr|underwriting decision|investment advice|guarantee returns|fiduciary)\b/i;

const COMPLEX_ESCALATION =
  /\b(1031|short sale|foreclosure|estate sale|probate|divorce|power of attorney|disclosure liability|who is liable|can i sue|escrow dispute|earnest money dispute|syndicat|copropriété.*litige)\b/i;

export type ClientChatContext = {
  listingId?: string | null;
  projectId?: string | null;
  listingTitle?: string | null;
  city?: string | null;
  availabilityNote?: string | null;
  features?: string[];
  introducedByBrokerId?: string | null;
};

export type QualificationState = {
  timeline?: "soon" | "later" | "unknown";
  budgetRange?: string;
  financing?: "pre_approved" | "cash" | "exploring" | "unknown";
  /** Best time for broker callback (free text). */
  preferredContactTime?: string;
  name?: string;
  phone?: string;
  email?: string;
  /** User asked to book / see the property — boosts HOT with timeline / financing signals. */
  visitIntent?: boolean;
  /** Wants to speak with a broker / callback — boosts HOT with engagement signals. */
  brokerSpeakIntent?: boolean;
  /** After phone + name: optional email phase (not required to create lead). */
  emailOptionalPhase?: "asked";
  emailDeclined?: boolean;
  transcript: string[];
};

export type ClientChatFlags = {
  escalateToBroker: boolean;
  escalationReason:
    | "legal_or_financial"
    | "complex_transaction"
    | "hot_lead_handoff"
    | "viewing_request"
    | "offer_intent"
    | "callback_request"
    | "discriminatory"
    | "regulated_financing"
    | null;
  qualificationTier: LeadTier | null;
  /** Warm/hot: ready to persist lead once contact is complete. */
  leadReady: boolean;
  /** Cold path: conversation ended without collecting PII. */
  chatCompleteCold: boolean;
  missingFields: ("timeline" | "budget" | "financing" | "name" | "phone" | "email")[];
};

export type ClientChatResult = {
  reply: string;
  state: QualificationState;
  flags: ClientChatFlags;
  disclaimer: string;
};

const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;
const PHONE_RE = /(\+?\d[\d\s().-]{8,}\d)/;

function extractEmail(text: string): string | undefined {
  const m = text.match(EMAIL_RE);
  return m ? m[0].trim() : undefined;
}

function extractPhone(text: string): string | undefined {
  const m = text.match(PHONE_RE);
  if (!m) return undefined;
  const digits = m[1].replace(/\D/g, "");
  return digits.length >= 10 ? m[1].trim() : undefined;
}

function extractName(text: string): string | undefined {
  const t = text.trim();
  const m = t.match(/\b(?:my name is|i'?m|this is|je m'appelle|moi c'est)\s+([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s.'-]{1,40})/i);
  if (m) return m[1].trim().split(/\s+/).slice(0, 4).join(" ");
  if (t.length >= 2 && t.length <= 50 && /^[A-Za-zÀ-ÿ\s.'-]+$/.test(t) && !EMAIL_RE.test(t) && !PHONE_RE.test(t)) {
    const words = t.split(/\s+/).length;
    if (words <= 4) return t;
  }
  return undefined;
}

function parseTimeline(text: string): QualificationState["timeline"] {
  const l = text.toLowerCase();
  if (
    /\b(just browsing|only looking|not (really )?buying|just exploring|no plan to buy|years away|pas intéressé à acheter)\b/i.test(l)
  ) {
    return "later";
  }
  if (
    /\b(asap|soon|this month|next month|right now|urgent|within (a )?few weeks|immediately|ready to (buy|move|offer)|buying soon|rapidement)\b/i.test(l)
  ) {
    return "soon";
  }
  if (/\b(later|next year|research|no rush|6 months|12 months|plus tard|je regarde)\b/i.test(l)) {
    return "later";
  }
  return "unknown";
}

function parseFinancing(text: string): QualificationState["financing"] {
  const l = text.toLowerCase();
  if (/\b(pre[- ]?approved|preapproval|pre-qualified|underwriter|lender letter|préapprouvé|pré-approuvé)\b/i.test(l)) {
    return "pre_approved";
  }
  if (/\bcash\b|all cash|no mortgage|comptant\b/i.test(l)) return "cash";
  if (/\b(exploring|figuring out|not sure|need a lender|talk to bank|first step|je ne sais pas encore)\b/i.test(l)) {
    return "exploring";
  }
  return "unknown";
}

function parseBudget(text: string): string | undefined {
  const l = text.toLowerCase();
  const m =
    l.match(/\$\s*([\d,]+(?:\.\d+)?)\s*k\b/i) ||
    l.match(/\$\s*([\d,]+(?:\.\d+)?)\s*m\b/i) ||
    l.match(/budget\s*(?:of|is|:)?\s*\$?\s*([\d,]+(?:\.\d+)?)\s*(k|m)?/i) ||
    l.match(/\$\s*[\d,]{3,}/) ||
    l.match(/\b(\d{3})\s*k\b/i);
  if (m) {
    return m[0].replace(/\s+/g, " ").trim().slice(0, 80);
  }
  if (/\b(under|around|about|between|max|environ|vers)\b.*\d/.test(l)) {
    return text.trim().slice(0, 120);
  }
  return undefined;
}

/**
 * HOT: soon + (pre-approved | cash) OR soon + visit intent OR visit + (pre-approved | cash).
 * COLD: later / browsing. WARM: other engaged cases.
 */
const BROKER_SPEAK_RE =
  /\b(speak|talk)\s+(with|to)\s+(a\s+)?(broker|courtier|agent|someone)|call\s+me|have\s+(a\s+)?broker\s+call|rappel|callback|want\s+(to\s+)?(speak|talk)\s+to\s+(a\s+)?(human|broker|person)\b/i;

export function parseBrokerSpeakIntent(text: string): boolean {
  return BROKER_SPEAK_RE.test(text.trim());
}

export function classifyQuebecTier(s: QualificationState): LeadTier {
  if (s.timeline === "later") return "cold";
  if (s.timeline === "unknown") return "warm";
  const visit = Boolean(s.visitIntent);
  const brokerAsk = Boolean(s.brokerSpeakIntent);
  const finOk = s.financing === "pre_approved" || s.financing === "cash";
  const soon = s.timeline === "soon";
  if (soon && finOk) return "hot";
  if (soon && visit) return "hot";
  if (visit && finOk) return "hot";
  if (brokerAsk && (soon || visit || finOk)) return "hot";
  if (soon && s.financing === "exploring") return "warm";
  if (soon) return "warm";
  return "cold";
}

export function tierToScore(tier: LeadTier): number {
  if (tier === "hot") return 92;
  if (tier === "warm") return 68;
  return 34;
}

function explainTier(tier: LeadTier, s: QualificationState): string[] {
  const r: string[] = [];
  if (tier === "hot")
    r.push("High intent: soon + financing ready, and/or visit request (rule-based)");
  else if (tier === "warm") r.push("Interested; not yet pre-approved / timing mixed");
  else r.push("Browsing or later timeline");
  r.push(`Timeline: ${s.timeline}`, `Financing: ${s.financing}`);
  if (s.visitIntent) r.push("Visit / showing interest: yes");
  if (s.brokerSpeakIntent) r.push("Asked to speak with broker / callback");
  if (s.preferredContactTime) r.push(`Preferred contact time: ${s.preferredContactTime}`);
  if (s.budgetRange) r.push(`Budget noted: ${s.budgetRange}`);
  return r;
}

function availabilityReply(ctx: ClientChatContext): string {
  const place = ctx.city ?? "this area";
  const soft =
    ctx.availabilityNote ??
    "Listing status can change without notice here — a licensed broker must confirm availability before you rely on it.";
  return `Yes 👍 ${soft} This property in ${place} is shown as available on our site — please confirm with a broker before relying on that.`;
}

function basicFaqSnippet(message: string, ctx: ClientChatContext): string | null {
  const m = message.toLowerCase();
  if (/available|still available|disponible|availability|when can i (see|view|visit)|showing|tour|visite/i.test(m)) {
    return availabilityReply(ctx);
  }
  if (/where|location|address|city|neighborhood|area\b|adresse|quartier/i.test(m)) {
    if (ctx.city) {
      return `This listing is tied to ${ctx.city}. The exact address and map are on the listing page or can be provided by a licensed broker — I can't verify legal descriptions.`;
    }
    return "Location details are on the listing; a licensed broker can confirm the address and boundaries.";
  }
  if (/feature|parking|garage|bedroom|bath|sq\s*ft|amenities|pet|furnished|chambre|stationnement/i.test(m)) {
    const feats = ctx.features?.length ? ` Mentioned highlights: ${ctx.features.slice(0, 5).join(", ")}.` : "";
    return `I can only repeat public listing information.${feats} A broker should verify everything material in writing.`;
  }
  if (/price|negotiate|offer|how much|cost\b|prix|négocier/i.test(m)) {
    return "I can't negotiate price or advise on offers — that's brokerage work reserved for a licensed courtier. They can explain comparables and the process.";
  }
  return null;
}

/** Buying interest only (before schedule + contact capture). */
function missingInterest(s: QualificationState): ("timeline" | "budget" | "financing")[] {
  const miss: ("timeline" | "budget" | "financing")[] = [];
  if (!s.timeline || s.timeline === "unknown") miss.push("timeline");
  if (!s.budgetRange?.trim()) miss.push("budget");
  if (!s.financing || s.financing === "unknown") miss.push("financing");
  return miss;
}

/** After qualification: full name first, then phone (conversion + natural flow). */
function missingContactRequired(s: QualificationState): ("name" | "phone")[] {
  const miss: ("name" | "phone")[] = [];
  if (!s.name?.trim()) miss.push("name");
  if (!s.phone?.trim()) miss.push("phone");
  return miss;
}

const EMAIL_SKIP_RE =
  /\b(skip|no thanks|no thank you|non merci|pas d'email|pas d email|no email|pass|later)\b/i;

function optionalEmailPrompt(): string {
  return "If you'd like email updates too, share your email — or reply **skip**.";
}

function corePrompt(field: "timeline" | "budget" | "financing" | "contactTime"): string {
  switch (field) {
    case "timeline":
      return "Are you looking to buy soon or just exploring?";
    case "budget":
      return "Nice! Do you already have a budget range in mind?";
    case "financing":
      return "Perfect 👍 Are you pre-approved for a mortgage? (If you're paying cash, just say cash.)";
    case "contactTime":
      return "Great — when's the best time for a broker to reach you? (e.g. mornings, after 5pm, weekends — or say **anytime**.)";
    default:
      return "";
  }
}

function contactPrompt(field: "name" | "phone"): string {
  if (field === "name") {
    return "Perfect 👍 What's your **full name** so we can personalize the follow-up?";
  }
  return "Thanks! What's your best **phone number** for a quick call or text?";
}

function initialGreeting(_ctx: ClientChatContext): string {
  return [
    "Hi! I can help you with this property.",
    "",
    "Are you looking to buy soon or just exploring?",
    "",
    "I'm a digital assistant only — not a licensed courtier. Full notice below.",
    "",
    CLIENT_CHAT_DISCLAIMER,
  ].join("\n");
}

export function computeChatLeadScore(state: QualificationState): {
  merged: number;
  tier: LeadTier;
  qScore: number;
  qReasons: string[];
} {
  const tier = classifyQuebecTier(state);
  const merged = tierToScore(tier);
  const qReasons = explainTier(tier, state);
  return { merged, tier, qScore: merged, qReasons };
}

export function processClientChatTurn(params: {
  message: string;
  state: QualificationState;
  context: ClientChatContext;
}): ClientChatResult {
  const raw = typeof params.message === "string" ? params.message.trim() : "";
  const ctx = params.context;
  let state: QualificationState = {
    ...params.state,
    transcript: [...(params.state.transcript ?? [])],
  };

  if (raw) {
    state.transcript.push(`User: ${raw}`);
  }

  const flags: ClientChatFlags = {
    escalateToBroker: false,
    escalationReason: null,
    qualificationTier: null,
    leadReady: false,
    chatCompleteCold: false,
    missingFields: [],
  };

  if (raw && LEGAL_FINANCIAL_ESCALATION.test(raw)) {
    flags.escalateToBroker = true;
    flags.escalationReason = "legal_or_financial";
    return {
      reply: `${CLIENT_CHAT_DISCLAIMER}\n\nI can't provide legal or tax guidance or act as a broker. A licensed courtier or notaire can help with Québec-specific questions.`,
      state,
      flags,
      disclaimer: CLIENT_CHAT_DISCLAIMER,
    };
  }

  if (raw && COMPLEX_ESCALATION.test(raw)) {
    flags.escalateToBroker = true;
    flags.escalationReason = "complex_transaction";
    return {
      reply: `${CLIENT_CHAT_DISCLAIMER}\n\nThat usually needs a licensed broker and sometimes a notaire or attorney. I've flagged this for a human — I can't assess complex situations in chat.`,
      state,
      flags,
      disclaimer: CLIENT_CHAT_DISCLAIMER,
    };
  }

  const safetyHit = classifyInboundSafety(raw);
  if (raw && safetyHit === "discriminatory") {
    flags.escalateToBroker = true;
    flags.escalationReason = "discriminatory";
    return {
      reply: `${CLIENT_CHAT_DISCLAIMER}\n\nWe treat every client with respect. Housing decisions belong with a licensed broker under fair-housing rules — I can't engage with that type of request.`,
      state,
      flags,
      disclaimer: CLIENT_CHAT_DISCLAIMER,
    };
  }
  /** Visit / tour language: qualify instead of hard-stopping the funnel. */
  if (raw && safetyHit === "viewing_request") {
    state.visitIntent = true;
  }
  if (raw && safetyHit === "callback_request") {
    state.brokerSpeakIntent = true;
  }
  if (
    raw &&
    safetyHit &&
    safetyHit !== "discriminatory" &&
    safetyHit !== "viewing_request" &&
    safetyHit !== "callback_request"
  ) {
    flags.escalateToBroker = true;
    if (safetyHit === "offer_negotiation") flags.escalationReason = "offer_intent";
    else if (safetyHit === "legal_contract") flags.escalationReason = "legal_or_financial";
    else if (safetyHit === "regulated_financing") flags.escalationReason = "regulated_financing";
    return {
      reply: `${CLIENT_CHAT_DISCLAIMER}\n\nA broker will help you with that directly — I’m only an assistant, not a licensed courtier.`,
      state,
      flags,
      disclaimer: CLIENT_CHAT_DISCLAIMER,
    };
  }

  /** Snapshot before applying this turn's answers (for contact-time scheduling). */
  const interestIncompleteBefore = missingInterest(state).length > 0;

  const tl = parseTimeline(raw);
  if (tl !== "unknown") state.timeline = tl;
  const fin = parseFinancing(raw);
  if (fin !== "unknown") state.financing = fin;
  const bud = parseBudget(raw);
  if (bud) state.budgetRange = bud;
  const em = extractEmail(raw);
  if (em) state.email = em;
  const ph = extractPhone(raw);
  if (ph) state.phone = ph;
  const nm = extractName(raw);
  if (nm) state.name = nm;
  if (raw && parseBrokerSpeakIntent(raw)) state.brokerSpeakIntent = true;

  let replyParts: string[] = [];

  if (!raw) {
    return {
      reply: initialGreeting(ctx),
      state,
      flags,
      disclaimer: CLIENT_CHAT_DISCLAIMER,
    };
  }

  const faq = basicFaqSnippet(raw, ctx);
  if (faq) {
    replyParts.push(faq);
  }

  const missInterest = missingInterest(state);
  if (missInterest.length > 0) {
    flags.missingFields = [...missInterest, ...missingContactRequired(state)] as ClientChatFlags["missingFields"];
    replyParts.push(corePrompt(missInterest[0]!));
    return {
      reply: replyParts.join("\n\n"),
      state,
      flags,
      disclaimer: CLIENT_CHAT_DISCLAIMER,
    };
  }

  const tier = classifyQuebecTier(state);
  flags.qualificationTier = tier;

  if (tier === "cold") {
    flags.chatCompleteCold = true;
    replyParts.push(
      "Thanks for letting me know. Feel free to keep browsing — when you're ready, a licensed broker can help with next steps."
    );
    replyParts.push(`\n${CLIENT_CHAT_DISCLAIMER}`);
    const transcriptText = state.transcript.filter((l) => !l.startsWith("[System summary]")).join("\n");
    state.transcript.push(
      `[System summary]\nTier: cold. Transcript:\n${transcriptText}\nAnswers: ${JSON.stringify({
        timeline: state.timeline,
        budget: state.budgetRange,
        financing: state.financing,
      })}`
    );
    return {
      reply: replyParts.join("\n\n"),
      state,
      flags,
      disclaimer: CLIENT_CHAT_DISCLAIMER,
    };
  }

  const interestJustCompletedThisTurn = interestIncompleteBefore && missingInterest(state).length === 0;

  const junkContactTimeReply =
    /\b(that'?s everything|that is everything|all set|done|thanks|thank you|ok thanks|thx|cool)\b/i.test(raw);

  if (!state.preferredContactTime?.trim()) {
    if (raw.trim() && !interestJustCompletedThisTurn && !junkContactTimeReply) {
      state.preferredContactTime = raw.trim().slice(0, 120);
    }
    if (!state.preferredContactTime?.trim()) {
      flags.missingFields = [
        "contactTime",
        ...missingContactRequired(state),
      ] as ClientChatFlags["missingFields"];
      replyParts.push(corePrompt("contactTime"));
      return {
        reply: replyParts.join("\n\n"),
        state,
        flags,
        disclaimer: CLIENT_CHAT_DISCLAIMER,
      };
    }
  }

  const missContact = missingContactRequired(state);
  flags.missingFields = missContact as unknown as ClientChatFlags["missingFields"];
  if (missContact.length > 0) {
    replyParts.push(contactPrompt(missContact[0]!));
    return {
      reply: replyParts.join("\n\n"),
      state,
      flags,
      disclaimer: CLIENT_CHAT_DISCLAIMER,
    };
  }

  const hasRealEmail = Boolean(state.email?.trim());
  if (!hasRealEmail && !state.emailDeclined) {
    if (state.emailOptionalPhase !== "asked") {
      state.emailOptionalPhase = "asked";
      replyParts.push(optionalEmailPrompt());
      flags.missingFields = ["email"];
      return {
        reply: replyParts.join("\n\n"),
        state,
        flags,
        disclaimer: CLIENT_CHAT_DISCLAIMER,
      };
    }
    if (raw) {
      if (EMAIL_SKIP_RE.test(raw)) {
        state.emailDeclined = true;
      } else if (extractEmail(raw)) {
        state.email = extractEmail(raw)!;
      } else {
        state.emailDeclined = true;
      }
    }
    if (!state.email?.trim() && !state.emailDeclined) {
      replyParts.push("No problem — paste your email or type **skip**.");
      flags.missingFields = ["email"];
      return {
        reply: replyParts.join("\n\n"),
        state,
        flags,
        disclaimer: CLIENT_CHAT_DISCLAIMER,
      };
    }
  }

  flags.leadReady = true;
  const { merged, qScore, qReasons } = computeChatLeadScore(state);
  const transcriptText = state.transcript.filter((l) => !l.startsWith("[System summary]")).join("\n");
  state.transcript.push(
    `[System summary]\nTier: ${tier}. Score: ${merged}. ${qReasons.join(". ")}\nTranscript:\n${transcriptText}`
  );

  if (tier === "hot") {
    flags.escalateToBroker = true;
    flags.escalationReason = "hot_lead_handoff";
    replyParts.push("Thanks! A broker will contact you shortly 👍 Usually within a few minutes.");
    replyParts.push(
      "They'll confirm listing details (availability, disclosures) under Québec brokerage rules — I can't do that for you."
    );
    replyParts.push(`\n${CLIENT_CHAT_DISCLAIMER}`);
    return {
      reply: replyParts.join("\n\n"),
      state: { ...state, transcript: state.transcript },
      flags,
      disclaimer: CLIENT_CHAT_DISCLAIMER,
    };
  }

  replyParts.push("Thanks! A broker will contact you shortly 👍 Usually within a few minutes.");
  replyParts.push(`\n${CLIENT_CHAT_DISCLAIMER}`);
  return {
    reply: replyParts.join("\n\n"),
    state,
    flags,
    disclaimer: CLIENT_CHAT_DISCLAIMER,
  };
}

export type LeadPayloadFromChat = {
  name: string;
  email: string;
  phone: string;
  message: string;
  score: number;
  tier: LeadTier;
  qualificationSnapshot: Record<string, unknown>;
};

export function buildLeadPayloadFromChat(
  state: QualificationState,
  merged: number,
  tier: LeadTier,
  qScore: number,
  qReasons: string[]
): LeadPayloadFromChat {
  const transcriptText = state.transcript.filter((l) => !l.startsWith("[System summary]")).join("\n");
  const label = tier === "hot" ? "HOT LEAD (Québec chat)" : `Lead (${tier})`;
  return {
    name: state.name ?? "Chat user",
    email: state.email ?? "",
    phone: state.phone ?? "",
    message:
      `${label}\n\n` +
      (transcriptText.slice(0, 8000) || "Lead from AI client chat") +
      `\n\n---\nSummary: ${qReasons.join("; ")}`,
    score: merged,
    tier,
    qualificationSnapshot: {
      timeline: state.timeline,
      budgetRange: state.budgetRange,
      financing: state.financing,
      qualificationScore: qScore,
      mergedScore: merged,
      tier,
      leadLabel: tier === "hot" ? "HOT LEAD" : undefined,
      source: "client_chat_quebec_v1",
      visitIntent: state.visitIntent,
      brokerSpeakIntent: state.brokerSpeakIntent,
      preferredContactTime: state.preferredContactTime,
      emailDeclined: state.emailDeclined,
      emailPlaceholder: !state.email?.trim(),
      complianceTag: "quebec_real_estate_v1",
      conversationHistory: state.transcript.filter((l) => !l.startsWith("[System summary]")),
    },
  };
}
