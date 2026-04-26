export type AdAudience = "buyer" | "seller" | "host" | "broker";

export type AdCopyBase = { headline: string; body: string };

export function generateAdCopy(input: { audience: AdAudience; city?: string }): {
  audience: AdAudience;
  city?: string;
} & AdCopyBase & {
  /** Same core message, shaped per channel (starter ideas). */
  channels: {
    tiktok: { hook: string; caption: string };
    meta: { headline: string; body: string };
    google: { headlines: [string, string]; description: string };
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
  const h2 =
    base.headline.length > 30
      ? `${base.headline.slice(0, 27).trimEnd()}...`
      : base.headline;

  return {
    audience: input.audience,
    city: input.city,
    ...base,
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
  };
}
