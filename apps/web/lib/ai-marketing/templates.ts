import type { ContentTheme, EmailKind, ToneId } from "./types";

/**
 * Theme snippets for prompt construction.
 * Future: analytics / `syncMarketingMetrics` may rank which themes to inject more often — keep prompts here centralized.
 */
/** Short system context per theme — injected into prompts for platform-optimized copy */
export const THEME_PROMPT_SNIPPETS: Record<ContentTheme, string> = {
  bnhub_listings:
    "Focus on curated short-term stays on BNHub: booking flow, host quality, standout amenities, location. No fake discounts or invented review scores.",
  travel_inspiration:
    "Inspire travel and discovery: weekend getaways, local gems, slow travel. Tie naturally to booking a verified stay on BNHub when relevant.",
  re_investment:
    "Connect travel-stay demand and hospitality yield to serious investors: diversification, occupancy themes, professional hosting — no guaranteed returns.",
  platform_awareness:
    "Explain LECIPM / BNHub as the real-estate + stays ecosystem: trust, brokers, listings, BNHub for stays. Clear, credible, not hypey.",
  trust_reviews:
    "Emphasize verified guests, transparent reviews, host accountability, and safe bookings. No fabricated testimonials.",
};

export function normalizeTone(tone: string): ToneId {
  const t = tone.toLowerCase().trim();
  if (t.includes("viral")) return "viral";
  if (t.includes("emotion")) return "emotional";
  if (t.includes("play")) return "playful";
  if (t.includes("urgent") || t.includes("fomo")) return "urgent";
  return "professional";
}

export function toneInstructions(tone: ToneId): string {
  switch (tone) {
    case "viral":
      return "Hooks in the first line; short lines; strong pattern interrupts; platform-native (hashtags only if fitting).";
    case "emotional":
      return "Warm, human, specific imagery; empathy for travelers and hosts; avoid clichés.";
    case "playful":
      return "Light wit; still credible for real estate / hospitality; one clever line max.";
    case "urgent":
      return "Time-bound or scarcity-framed without lying; clear next step.";
    default:
      return "Clear, confident, concise; suitable for mixed professional audiences.";
  }
}

export function emailKindInstructions(kind: EmailKind): string {
  switch (kind) {
    case "partnership":
      return "B2B outreach: mutual value, one specific ask, low friction reply. No fabricated metrics.";
    case "onboarding":
      return "Welcome + 3 crisp steps to get value (e.g. browse stays, save a listing, book). Friendly, skimmable.";
    case "promotional":
      return "One campaign angle, one offer framing (without inventing prices), single CTA.";
    default:
      return "Professional marketing email.";
  }
}
