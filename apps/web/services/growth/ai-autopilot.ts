/**
 * Semi-autonomous growth “autopilot” — composes deterministic generators (no mandatory LLM).
 * Use in cron, admin tools, or internal dashboards. See docs/10k-scaling-system.md.
 */

import { buildOutreachMessage, OUTREACH_TEMPLATES, personalizeMessage, type OutreachPersona } from "./ai-outreach";
import { generateDailyContentIdeas, type ContentIdea } from "./content-engine";

export type ChannelPerformanceRow = {
  source: string;
  visits?: number;
  signups?: number;
  spendCents?: number;
};

export type AdCreativeSuggestion = {
  id: string;
  angle: string;
  headline: string;
  primaryText: string;
  format: "9:16_video" | "1x1_static" | "carousel";
  cta: string;
};

/** Rank channels: signups first, then visits, then inverse CAC if spend known. */
export function identifyHighPerformingChannels(rows: ChannelPerformanceRow[]): ChannelPerformanceRow[] {
  return [...rows].sort((a, b) => {
    const su = (b.signups ?? 0) - (a.signups ?? 0);
    if (su !== 0) return su;
    const vi = (b.visits ?? 0) - (a.visits ?? 0);
    if (vi !== 0) return vi;
    const ca =
      (a.signups && a.spendCents ? a.spendCents / a.signups : Number.POSITIVE_INFINITY) -
      (b.signups && b.spendCents ? b.spendCents / b.signups : Number.POSITIVE_INFINITY);
    return ca;
  });
}

export function suggestAdCreatives(marketLabel: string): AdCreativeSuggestion[] {
  const m = marketLabel.trim() || "your city";
  return [
    {
      id: "guest_price_clarity",
      angle: "Guest — full price before click",
      headline: `Stays in ${m} with no surprise fees`,
      primaryText: "Verified hosts, clear totals, book in minutes.",
      format: "9:16_video",
      cta: "Find a stay",
    },
    {
      id: "host_supply",
      angle: "Host — lower friction",
      headline: "List where travelers already search",
      primaryText: "Onboarding help, fair fees, local support.",
      format: "9:16_video",
      cta: "List your place",
    },
    {
      id: "trust_proof",
      angle: "Trust — verification",
      headline: "We verify before we promote",
      primaryText: "Fewer bad listings. More peace of mind.",
      format: "1x1_static",
      cta: "See listings",
    },
    {
      id: "retarget_social",
      angle: "Retargeting — social proof",
      headline: "Still planning your trip?",
      primaryText: "Save your dates — early users get priority support.",
      format: "carousel",
      cta: "Continue",
    },
  ];
}

export type DailyAutopilotBrief = {
  date: string;
  contentIdeas: ContentIdea[];
  outreach: { host: string; guest: string; followup: string };
  adCreatives: AdCreativeSuggestion[];
  channelRankingNote: string;
};

export function buildDailyAutopilotBrief(date = new Date(), area = "your area"): DailyAutopilotBrief {
  const contentIdeas = generateDailyContentIdeas(date, 5);
  const vars = { name: undefined, area };
  return {
    date: date.toISOString().slice(0, 10),
    contentIdeas,
    outreach: {
      host: buildOutreachMessage("host", vars),
      guest: buildOutreachMessage("guest", vars),
      followup: personalizeMessage(OUTREACH_TEMPLATES.followup, vars),
    },
    adCreatives: suggestAdCreatives(area),
    channelRankingNote:
      "Paste last week’s channel rows into identifyHighPerformingChannels(); shift 10–20% budget to top 2, cut bottom 30%.",
  };
}

export function generateOutreachForPersona(persona: OutreachPersona, area: string, name?: string) {
  return buildOutreachMessage(persona, { area, name });
}
