import type { MarketingAudience, MarketingGoal, MarketingPlatform, StudioScriptBlock } from "./content.types";

const HOOKS: Record<MarketingAudience, string[]> = {
  broker: [
    "Want more clients without chasing dead leads all day?",
    "Still paying for Zillow views that never call back?",
    "Your next listing client might already be on LECIPM — are you showing up?",
  ],
  investor: [
    "Looking for a deal that still pencils after interest and taxes?",
    "What if the next rent roll you needed was on one clean dashboard?",
    "Sick of spreadsheets that go stale the moment you file them?",
  ],
  buyer: [
    "Tired of listings that disappear the second you get serious?",
    "What if you could see FSBO, stays, and broker options in one place?",
    "House hunting in Quebec shouldn’t feel like a second job.",
  ],
  host: [
    "Not enough nights booked? Your photos might not be the problem.",
    "What if the right guests found you through search — not just OTAs?",
    "Struggling to price weekends without undercutting every night?",
  ],
};

const MESSAGES: Record<MarketingGoal, Record<MarketingAudience, string[]>> = {
  leads: {
    broker:
      "LECIPM routes serious buyers and hosts into partner workflows. Lead quality beats spray-and-pray volume — you keep context from search to first call.",
    investor:
      "Map inventory, rent comps, and tools in one stack so you can ask better questions, faster — then validate with your own due diligence and licensed partners.",
    buyer:
      "Save listings, compare routes to financing, and contact sellers on your timeline. Clear next steps, fewer open tabs.",
    host:
      "Connect BNHUB stays to guests already searching the region — and keep the rules and pricing visible before they book.",
  },
  awareness: {
    broker:
      "A modern marketplace shows up when people search the city, not your agency name. Visibility here compounds with your own brand — we’re not a replacement for it.",
    investor:
      "Build familiarity with a market before you need to move. Watch inventory move and learn the rhythm of each neighbourhood.",
    buyer:
      "See what’s for sale, what’s bookable, and what’s new — in one LECIPM city hub, without a dozen sign-ups.",
    host:
      "Get discovered alongside traditional listings so travellers understand the neighbourhood before they check out.",
  },
  conversion: {
    broker:
      "Turn intent into a booked consult: the product keeps context so your CRM isn’t starting from a blank form every time.",
    investor:
      "When you are ready, export notes and pair them with an advisor. Nothing here is investment advice — it’s a faster path to a real conversation.",
    buyer:
      "Shortlist, compare, and message when you are ready. CTAs on every page end in a real action, not a dead form.",
    host:
      "Pricing and availability you control, with a checkout path that respects local rules. Fewer back-and-forth DMs.",
  },
};

const CTAS: Record<MarketingPlatform, string[]> = {
  TIKTOK: [
    "Save this for your next follow-up script · Link in profile",
    "Comment your city — we’ll drop the hub",
    "Follow for one platform tip a day that doesn’t feel gross",
  ],
  INSTAGRAM: [
    "Save + share with your partner agent",
    "Tap the link in bio — start in your city",
    "DM us your market — we’ll point you to the right hub",
  ],
  YOUTUBE: [
    "Subscribe for walkthroughs of each city hub",
    "Chapters next — tell us what to cover in comments",
    "Link below for the LECIPM city you care about",
  ],
};

function pick<T>(arr: T[], seed: string): T {
  const h = Array.from(seed).reduce((a, c) => a + c.charCodeAt(0), 0);
  return arr[h % arr.length]!;
}

/**
 * Generate a 3-beat short-form script: hook, main, CTA.
 * Deterministic for the same (platform, audience, goal, title) for repeatable exports.
 */
export function generateVideoScript(input: {
  platform: MarketingPlatform;
  audience: MarketingAudience;
  goal: MarketingGoal;
  title: string;
}): StudioScriptBlock {
  const seed = `${input.platform}:${input.audience}:${input.goal}:${input.title.trim()}`;

  const hook = pick(HOOKS[input.audience], seed + "h");
  const mainMessage = MESSAGES[input.goal][input.audience];
  const cta = pick(CTAS[input.platform], seed + "c");

  const fullScript = [hook, "", mainMessage, "", cta].join("\n");

  return { hook, mainMessage, cta, fullScript };
}

export function fullScriptToCaption(block: StudioScriptBlock, maxLen = 2200): string {
  return block.fullScript.slice(0, maxLen);
}
