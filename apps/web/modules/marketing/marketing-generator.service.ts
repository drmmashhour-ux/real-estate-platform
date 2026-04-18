/**
 * Deterministic marketing copy generator (no external API — safe for production).
 * Optional: set `OPENAI_API_KEY` later for variants; this module stays the default path.
 */

export type MarketingTarget = "host" | "buyer" | "investor";

export type MarketingGeneratorInput = {
  target: MarketingTarget;
  city: string;
  /** `bnb` = Airbnb-style friendly OTA phrasing + layout hint (host BNHub). */
  tone: "luxury" | "modern" | "direct" | "bnb";
  objective: "book_call" | "sign_up" | "browse_listings" | "list_property";
};

export type MarketingGeneratorOutput = {
  headlines: string[];
  descriptions: string[];
  socialCaptions: string[];
  hashtags: string[];
};

/** Poster-style + promotion blocks (text-only “creative” — export to Canva/Photoshop). */
export type MarketingCreativeBlocks = {
  posterHeadline: string;
  posterSubhead: string;
  posterCta: string;
  listingPromotionBlurb: string;
  brokerPromotionBlurb: string;
};

function cityLabel(city: string): string {
  const t = city.trim();
  return t || "your market";
}

export function generateMarketingCopy(input: MarketingGeneratorInput): MarketingGeneratorOutput {
  const c = cityLabel(input.city);
  const obj = input.objective;
  const headlines: string[] = [];
  const descriptions: string[] = [];
  const socialCaptions: string[] = [];

  if (input.target === "host") {
    if (input.tone === "bnb") {
      headlines.push(
        `Your place in ${c} — ready for guests`,
        `Whole home · private room · flexible nights`,
        `Set your price. Host on your terms.`,
        `Guests book with confidence on LECIPM BNHub`,
        `Photos, calendar, payouts — one flow`,
        `List once. Reach Québec travelers.`,
        `Short stays made simple in ${c}`,
        `Host toolkit built for real operators`,
        `Secure checkout where Stripe is enabled`,
        `From listing to confirmed guest`
      );
    } else {
    headlines.push(
      `Turn your ${c} property into booked nights`,
      `BNHub hosts in ${c} — list once, manage in one place`,
      `More visibility. Less friction. Hosting on LECIPM`,
      `Stripe-backed stays for guests who book with confidence`,
      `Your calendar. Your rules. Real bookings`,
      `Short stays in ${c} — professional listing tools`,
      `From first photo to confirmed guest`,
      `Host where Québec travelers already search`,
      `Pricing help + calendar sync — built for busy hosts`,
      `List on LECIPM — stay in control of payouts`
    );
    }
    descriptions.push(
      `Publish your stay, set availability, and accept reservations with checkout guests trust in ${c}.`,
      `LECIPM BNHub: listing wizard, messaging, and payments where enabled — built for serious hosts.`,
      `Reach guests searching for short stays. Secure flows. Clear host tools.`,
      `Minimize back-and-forth with structured booking and guest expectations up front.`,
      `Scale hosting without losing control — one hub for listings and operations.`
    );
    socialCaptions.push(
      `Hosting in ${c}? List your stay on LECIPM BNHub — clear pricing, secure checkout where enabled, tools that respect your time.`,
      `Turn extra capacity into booked nights. BNHub is built for Québec hosts who want fewer surprises.`,
      `Your property deserves a clean guest journey — from search to confirmed stay.`
    );
  } else if (input.target === "buyer") {
    headlines.push(
      `Find the right home in ${c}`,
      `Browse listings with clarity — not noise`,
      `Serious buyers start on LECIPM`,
      `Compare options. Move when you are ready.`,
      `Verified signals where shown — transparent next steps`,
      `Your purchase journey, organized`,
      `From search to broker intro — one platform`,
      `Listings + trust indicators in one flow`,
      `Buy smarter in ${c}`,
      `Less scrolling. More signal.`
    );
    descriptions.push(
      `Search homes in ${c}, save favorites, and connect with professionals when you are ready — no forced calls.`,
      `LECIPM unifies discovery and next steps so you can compare with confidence.`,
      `Clear disclosures and platform rules — built for disciplined buyers.`,
      `Move from browsing to action with structured contact flows.`,
      `Find inventory where available and understand tradeoffs faster.`
    );
    socialCaptions.push(
      `Buying in ${c}? LECIPM helps you browse with clarity and reach out when it fits your timeline.`,
      `Less noise, more signal — listings and next steps in one place.`,
      `Compare seriously: save listings, track what matters, connect with brokers on your terms.`
    );
  } else {
    headlines.push(
      `Underwrite ${c} deals with discipline`,
      `Model returns. Stress assumptions. Decide with data.`,
      `Investment workspace built for repeat investors`,
      `Scenario analysis without spreadsheet chaos`,
      `LECIPM — clarity before you commit capital`,
      `Compare deals side-by-side in minutes`,
      `Risk-aware investing starts here`,
      `From thesis to checklist — faster`,
      `Portfolio thinking, practical tools`,
      `Invest smarter in ${c}`
    );
    descriptions.push(
      `Run scenarios, compare opportunities, and keep your pipeline organized — LECIPM investment tools for structured decisions.`,
      `Built for investors who want explainable assumptions and repeatable workflows.`,
      `Align underwriting with execution — fewer missed details.`,
      `See sensitivity quickly — time and capital are finite.`,
      `Keep diligence consistent across opportunities.`
    );
    socialCaptions.push(
      `Investing in ${c}? LECIPM helps you stress assumptions before you wire capital.`,
      `Discipline beats hype — scenario tools that respect your process.`,
      `Serious underwriting, fewer spreadsheet traps.`
    );
  }

  if (obj === "book_call") {
    headlines[0] = `${headlines[0]} — book a call`;
  }

  const hashtags = [`#LECIPM`, `#${c.replace(/\s+/g, "")}`, `#RealEstate`, `#Quebec`];
  if (input.target === "host") hashtags.push("#BNHub", "#ShortTermRental");
  if (input.target === "investor") hashtags.push("#Investing", "#CapRate");

  return {
    headlines: headlines.slice(0, 10),
    descriptions: descriptions.slice(0, 5),
    socialCaptions,
    hashtags,
  };
}

/** Listing-style + broker-style promo copy blocks (deterministic). */
export function generateMarketingCreatives(input: MarketingGeneratorInput): MarketingCreativeBlocks {
  const c = cityLabel(input.city);
  if (input.target === "host") {
    return {
      posterHeadline: `Host in ${c}`,
      posterSubhead: "Short stays · secure checkout · one hub",
      posterCta: "List your stay — BNHub",
      listingPromotionBlurb: `New stay in ${c}: calendar, pricing, and guest messaging on LECIPM BNHub.`,
      brokerPromotionBlurb: `Refer hosts in ${c} — structured onboarding and operational tooling on-platform.`,
    };
  }
  if (input.target === "buyer") {
    return {
      posterHeadline: `Find your home in ${c}`,
      posterSubhead: "Browse · save · connect when ready",
      posterCta: "Explore listings",
      listingPromotionBlurb: `Featured inventory in ${c} — clear next steps, no forced calls.`,
      brokerPromotionBlurb: `Broker partners in ${c}: route serious buyers through LECIPM contact flows.`,
    };
  }
  return {
    posterHeadline: `Invest in ${c} with discipline`,
    posterSubhead: "Scenarios · sensitivity · repeatable workflow",
    posterCta: "Open analyzer",
    listingPromotionBlurb: `Underwrite opportunities in ${c} — assumptions you can explain to LPs.`,
    brokerPromotionBlurb: `Advisors: align client thesis with LECIPM investment workspace outputs.`,
  };
}
