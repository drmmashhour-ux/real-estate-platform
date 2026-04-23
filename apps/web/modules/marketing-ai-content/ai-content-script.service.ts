import type { AiContentPlatform, AiShortFormScript, MarketingAiContentIdea } from "./ai-content.types";

const HOOKS = [
  "Freeze — this saves you a bad Saturday open house.",
  "If your feed is noise, this is the one clip to save.",
  "Three lines. One city. Zero fluff.",
  "Stop guessing what buyers compare first.",
];

const BODIES: Record<string, string[]> = {
  broker: [
    "Route serious intent with context — not a cold form. LECIPM keeps the story from search to first call so you sound prepared, not desperate.",
    "Visibility compounds when your city hub shows up in search. Lead quality beats spray-and-pray — we’re built for that trade-off.",
  ],
  investor: [
    "Start with verifiable comps and carrying costs you can stress-test. We surface inventory and tools — you bring licensed advice and discipline.",
    "Momentum matters block by block. Use one dashboard to compare listings and rental liquidity before you chase a headline.",
  ],
  buyer: [
    "FSBO, stays, and broker-led options can live in one workflow — fewer tabs, clearer next steps when you’re ready to move.",
    "Don’t let FOMO pick your neighbourhood. Filter by what you’ll actually live with for five years, not five minutes of scroll.",
  ],
};

const CTAS: Record<AiContentPlatform, string[]> = {
  TIKTOK: [
    "Comment your borough — we’ll point you to the hub.",
    "Follow for one honest market clip a day.",
    "Link in bio: start in your city.",
  ],
  INSTAGRAM: [
    "Save this for your buyer consult — link in bio.",
    "Share with your partner — same page, fewer arguments.",
    "Tap link in bio: city hub + filters.",
  ],
  YOUTUBE: [
    "Subscribe for city walkthroughs — chapters next week.",
    "Full script in description — copy what fits your voice.",
    "Links below for the LECIPM city you care about.",
  ],
};

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length]!;
}

function inferAudience(idea: MarketingAiContentIdea): keyof typeof BODIES {
  const t = `${idea.title} ${idea.angle}`.toLowerCase();
  if (/\bbroker|agent|pipeline|lead/i.test(t)) return "broker";
  if (/\binvest|cap rate|rent comp|roi|portfolio/i.test(t)) return "investor";
  return "buyer";
}

function targetSeconds(platform: AiContentPlatform, format: MarketingAiContentIdea["formatHint"]): number {
  if (platform === "YOUTUBE") return format === "short_video" ? 45 : 60;
  if (platform === "TIKTOK") return 30;
  return format === "carousel" ? 35 : 28;
}

/**
 * Short-form script optimized for Reels / TikTok / Shorts voice.
 */
export function generateShortFormScript(
  idea: MarketingAiContentIdea,
  platform: AiContentPlatform
): AiShortFormScript {
  const audience = inferAudience(idea);
  const seed = idea.title.length + platform.length + idea.city.length;
  const hook = pick(HOOKS, seed);
  const body = pick(BODIES[audience], seed + 3);
  const cta = pick(CTAS[platform], seed + 11);
  const sec = targetSeconds(platform, idea.formatHint);
  const onScreenText = [hook.slice(0, 42), idea.city.toUpperCase(), "LECIPM"];

  return {
    ideaId: idea.id,
    platform,
    hook,
    body,
    cta,
    targetSeconds: sec,
    onScreenText,
  };
}

export function scriptToPlainText(s: AiShortFormScript): string {
  return [s.hook, "", s.body, "", s.cta].join("\n");
}
