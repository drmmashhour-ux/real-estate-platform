import type { CampaignFeedbackInsights, AdPlatform } from "@/lib/marketing/campaignFeedbackTypes";

export type AdAudience = "buyer" | "seller" | "host" | "broker";

export type AdCopyBase = { headline: string; body: string };

/** Order 87 — pattern-based variants: {@link import("./campaignLearning")} */
/** Order 88 — feedback-based `learnedVariant`: {@link import("./campaignFeedback")} */

function shortLine(s: string, max: number): string {
  const t = s.trim();
  if (t.length <= max) {
    return t;
  }
  return `${t.slice(0, Math.max(0, max - 1)).trim()}…`;
}

function buildLearnedVariantFromFeedback(
  original: AdCopyBase,
  audience: AdAudience,
  city: string | undefined,
  insights: CampaignFeedbackInsights
): { platform: AdPlatform; headline: string; body: string; reason: string } | null {
  if (!insights.eligible || !insights.bestPlatform) {
    return null;
  }
  const p = insights.bestPlatform;
  const cityText = city?.trim() ? ` ${city.trim()}` : "";
  const reason = "Optimized based on past performance";

  if (p === "tiktok") {
    return {
      platform: p,
      headline: shortLine(`Stop scrolling — ${original.headline}`, 100),
      body: shortLine(original.body, 160),
      reason,
    };
  }
  if (p === "meta") {
    return {
      platform: p,
      headline: shortLine(`Why ${audience}s choose LECIPM${cityText}`, 120),
      body: `${original.body} Clear CTA: explore trusted listings and book with confidence.`,
      reason,
    };
  }
  return {
    platform: p,
    headline: shortLine(`Real estate${cityText} • listings • book • LECIPM`, 90),
    body: shortLine(
      `Search ${city?.trim() ?? "local"} listings. ${original.body}`,
      280
    ),
    reason,
  };
}

export function generateAdCopy(input: {
  audience: AdAudience;
  city?: string;
  /** Order 88 — when present and {@link CampaignFeedbackInsights.eligible}, biases `learnedVariant` only; does not change `originalCopy` or root headline/body. */
  feedbackInsights?: CampaignFeedbackInsights | null;
}): {
  audience: AdAudience;
  city?: string;
  headline: string;
  body: string;
  originalCopy: AdCopyBase;
  channels: {
    tiktok: { hook: string; caption: string };
    meta: { headline: string; body: string };
    google: { headlines: [string, string]; description: string };
  };
  learnedVariant?: {
    platform: AdPlatform;
    headline: string;
    body: string;
    reason: string;
  };
} {
  const cityText = input.city ? ` in ${input.city}` : "";
  const map: Record<AdAudience, AdCopyBase> = {
    buyer: {
      headline: `Find smarter real estate opportunities${cityText}`,
      body: "Discover listings with better trust signals, pricing insight, and smarter search.",
    },
    seller: {
      headline: `Sell with smarter listing intelligence${cityText}`,
      body: "Improve your listing quality, pricing, and visibility with AI-assisted tools.",
    },
    host: {
      headline: `Turn your property into a better-performing stay${cityText}`,
      body: "Use pricing intelligence and conversion insights to improve bookings.",
    },
    broker: {
      headline: `Broker smarter with LECIPM${cityText}`,
      body: "Track listings, compliance, revenue, and client opportunities from one dashboard.",
    },
  };

  const base = map[input.audience];
  const originalCopy: AdCopyBase = { headline: base.headline, body: base.body };
  const h2 =
    base.headline.length > 30
      ? `${base.headline.slice(0, 27).trimEnd()}...`
      : base.headline;

  const learnedVariant =
    input.feedbackInsights != null
      ? buildLearnedVariantFromFeedback(originalCopy, input.audience, input.city, input.feedbackInsights)
      : undefined;

  return {
    audience: input.audience,
    city: input.city,
    headline: base.headline,
    body: base.body,
    originalCopy,
    channels: {
      tiktok: {
        hook: base.headline,
        caption: `${base.body} ${input.city ? `#${input.city.replace(/\s+/g, "")} #realestate` : "#realestate #lecipm"}`,
      },
      meta: { headline: base.headline, body: base.body },
      google: {
        headlines: [h2, base.body.slice(0, 90)] as [string, string],
        description: base.body,
      },
    },
    ...(learnedVariant ? { learnedVariant } : {}),
  };
}
