import { buildPsychologySuggestion } from "@/modules/sales-psychology/psychology-suggestion.service";
import type { StrategyKey } from "@/modules/sales-psychology/psychology-strategy.service";

import { detectClientPersonality } from "./personality-detection.service";
import { getPersonalityStrategy } from "./personality-strategy.service";
import type { ClientPersonalityType, ClosingCoachBundle } from "./personality.types";

const INDICATORS: Record<ClientPersonalityType, string> = {
  DRIVER: "⚡ Driver",
  ANALYTICAL: "🔷 Analytical",
  EXPRESSIVE: "✨ Expressive",
  AMIABLE: "🤝 Amiable",
};

const TONE: Record<ClientPersonalityType, string> = {
  DRIVER: "Crisp, outcome-first, time-boxed.",
  ANALYTICAL: "Structured, explicit assumptions, verifiable.",
  EXPRESSIVE: "Upbeat, narrative, milestone-anchored.",
  AMIABLE: "Warm, patient, choice-rich.",
};

const PERSONALITY_AVOID: Record<ClientPersonalityType, string[]> = {
  DRIVER: ["Long monologues", "Abstract philosophy before the point", "Open-ended 'whenever' closes"],
  ANALYTICAL: ["Unqualified superlatives", "Hand-wavy ROI without ranges", "Skipping methodology when they asked how"],
  EXPRESSIVE: ["Dry spreadsheet dumps with no 'why it matters'", "Flat monotone lists"],
  AMIABLE: ["Hard pressure closes", "Dismissive 'you should' language", "Ignoring relationship cues"],
};

/** Psychology strategy × personality → tailored line (LECIPM-style bounded offers). */
const ADAPTED: Partial<Record<StrategyKey, Record<ClientPersonalityType, string>>> = {
  reduce_claims_proof_questions: {
    DRIVER: "Three minutes — I'll show you how a qualified lead lands in your CRM, live.",
    ANALYTICAL: "Let me break down how leads are generated, filtered, and routed — with the metrics you can verify.",
    EXPRESSIVE: "Instead of claims, here's the story in one flow: intent → handoff — want to see it?",
    AMIABLE: "Totally fair — take a quick look when you're ready and decide for yourself.",
  },
  agree_decompress_reframe: {
    DRIVER: "Understood — bottom line: one proof point, then you choose yes or no on five minutes.",
    ANALYTICAL: "I hear you — here's the constraint and how we address it, in three bullets.",
    EXPRESSIVE: "I get it — let's reset: one clear win we can show without pressure.",
    AMIABLE: "Thanks for saying that — no rush. Would a short note or a calm walkthrough work better?",
  },
  teach_then_bridge: {
    DRIVER: "Here's the mechanism in one line — then you tell me if it's worth five minutes.",
    ANALYTICAL: "Step one: capture. Step two: score. Step three: route — I'll define each input.",
    EXPRESSIVE: "Picture the handoff getting cleaner — here's how that works in practice.",
    AMIABLE: "Happy to explain gently — want the short version first, then details?",
  },
  tighten_next_step: {
    DRIVER: "Pick a slot today — I'll send the invite while we're on the line.",
    ANALYTICAL: "Two times that work — I'll include agenda and success criteria in the invite.",
    EXPRESSIVE: "Let's lock momentum — send the calendar invite and we'll make it worth the time.",
    AMIABLE: "Whenever you're comfortable, I can send two slots — you pick what feels low-friction.",
  },
  concise_control_offer: {
    DRIVER: "Headline: fewer dead leads, faster routing — your call if we spend three minutes.",
    ANALYTICAL: "Headline with numbers: throughput and handoff latency — then you decide on a demo.",
    EXPRESSIVE: "Big picture: cleaner pipeline energy — your choice if we zoom in today.",
    AMIABLE: "Here's the essence — no trap doors — want a tiny next step you control?",
  },
  re_engage_choice: {
    DRIVER: "Fork: five-minute demo now or a one-page summary — which fits?",
    ANALYTICAL: "Fork: detailed deck vs. live data walk — which reduces your uncertainty faster?",
    EXPRESSIVE: "Two paths — both keep you in the driver's seat — which excites you more?",
    AMIABLE: "Two gentle options — whichever feels safer — I'm good either way.",
  },
};

function pickAdaptedSentence(key: StrategyKey, personality: ClientPersonalityType, fallback: string): string {
  const row = ADAPTED[key]?.[personality];
  if (row) return row;
  return fallback;
}

/**
 * Full closing coach: psychology state + DISC-style personality adaptation.
 */
export function buildClosingCoachBundle(lastClientUtterance: string, recentTranscript?: string): ClosingCoachBundle | null {
  const t = lastClientUtterance.trim();
  if (!t) return null;

  const psych = buildPsychologySuggestion(t, recentTranscript);
  const personality = detectClientPersonality(t, recentTranscript);
  const pStrat = getPersonalityStrategy(personality.primary);
  const adaptedExampleSentence = pickAdaptedSentence(psych.strategyKey as StrategyKey, personality.primary, psych.exampleSentence);

  const avoidCombined = [...new Set([...psych.avoidPhrases, ...PERSONALITY_AVOID[personality.primary]])];

  return {
    ...psych,
    personality,
    personalityStrategy: pStrat,
    recommendedTone: TONE[personality.primary],
    adaptedExampleSentence,
    avoidCombined,
    personalityIndicator: INDICATORS[personality.primary],
  };
}
