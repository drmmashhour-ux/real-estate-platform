import { getAdsLearningStore } from "./ads-learning-store";

export type AdCopyPlatform = "meta" | "google";
export type AdCopyObjective = "booking" | "lead" | "host_acquisition";

export type GenerateAdCopyInput = {
  platform: AdCopyPlatform;
  objective: AdCopyObjective;
  city: string;
  audience: string;
};

export type GeneratedAdCopy = {
  primaryTexts: [string, string, string];
  headlines: [string, string, string];
  cta: string;
};

export type VideoScriptInput = {
  city: string;
  objective: AdCopyObjective;
  audience: string;
  product?: "bnhub" | "fsbo" | "platform";
};

export type GeneratedVideoScript = {
  hook: string;
  body: string;
  cta: string;
  sceneSuggestions: string[];
};

function takeLearningHeadlines(count: number): string[] {
  const { winningHeadlines, losingHeadlines } = getAdsLearningStore();
  const avoid = new Set(losingHeadlines.map((s) => s.toLowerCase()));
  return winningHeadlines.filter((h) => !avoid.has(h.toLowerCase())).slice(0, count);
}

function pickCtaFromMemory(fallback: string): string {
  const { bestCtaPhrases, weakCtaPhrases } = getAdsLearningStore();
  const weak = new Set(weakCtaPhrases.map((s) => s.toLowerCase()));
  const preferred = bestCtaPhrases.find((c) => !weak.has(c.toLowerCase()));
  return preferred ?? fallback;
}

/**
 * Deterministic, template-based creatives — biased by `ads-learning-store`. No LLM / external API.
 */
export function generateAdCopy(input: GenerateAdCopyInput): GeneratedAdCopy {
  const city = input.city.trim() || "Montréal";
  const aud = input.audience.trim() || "Broad interest";
  const learned = takeLearningHeadlines(3);

  const ctaByObjective: Record<AdCopyObjective, string> = {
    booking: "Book your stay",
    lead: "Get the guide",
    host_acquisition: "List your place",
  };
  const cta = pickCtaFromMemory(ctaByObjective[input.objective]);

  let primaryTexts: [string, string, string];
  let headlines: [string, string, string];

  if (input.platform === "meta") {
    if (input.objective === "booking") {
      primaryTexts = [
        `Planning a trip to ${city}? Browse verified BNHub stays with clear nightly pricing — no guesswork.`,
        `${city} stays that match how you actually travel. Compare photos, rules, and book when you’re ready.`,
        `Skip the noise — short-term rentals on LECIPM with Stripe-backed checkout when you continue.`,
      ];
      headlines = [
        learned[0] ?? `${city} stays you’ll actually book`,
        learned[1] ?? `Verified nights in ${city}`,
        `Better than scrolling forever`,
      ];
    } else if (input.objective === "lead") {
      primaryTexts = [
        `Get a shortlist of ${city} options tailored to ${aud}. Leave your email — we’ll follow up with next steps.`,
        `Tell us your dates and budget for ${city}. We’ll route you to the right BNHub or resale path.`,
        `One form → clearer next steps for ${city}. No spam — CRM-backed on LECIPM.`,
      ];
      headlines = [
        learned[0] ?? `Your ${city} game plan`,
        learned[1] ?? `Talk to us about ${city}`,
        `Request a callback`,
      ];
    } else {
      primaryTexts = [
        `Earn from ${city} — list your short-term stay on BNHub with transparent host tools.`,
        `Hosts in ${city}: publish once, manage calendars, and keep pricing under your control.`,
        `${aud}: start with LECIPM host onboarding — verification where applicable.`,
      ];
      headlines = [
        learned[0] ?? `Host in ${city}`,
        learned[1] ?? `Turn your rental into income`,
        `Start your BNHub listing`,
      ];
    }
  } else {
    // Google Search — tighter, keyword-forward
    if (input.objective === "booking") {
      primaryTexts = [
        `${city} short-term rental — verified BNHub listings. Compare nightly rates and book securely.`,
        `Book ${city} stays — clear fees, host rules, and Stripe checkout on LECIPM.`,
        `${city} vacation rental search — real inventory, no fabricated badges.`,
      ];
      headlines = [
        learned[0] ?? `${city} BNHub Stays`,
        learned[1] ?? `Nightly Rates · ${city}`,
        `Book Short-Term Rentals`,
      ];
    } else if (input.objective === "lead") {
      primaryTexts = [
        `${city} real estate & stays — request a callback for ${aud}.`,
        `Lead form: ${city} — LECIPM routes investor, renter, and host intents.`,
        `Get ${city} options — one submission, human-reviewed follow-up.`,
      ];
      headlines = [
        learned[0] ?? `${city} — Request Info`,
        `LECIPM Lead Form`,
        `Talk to our team`,
      ];
    } else {
      primaryTexts = [
        `${city} host acquisition — list on BNHub; payouts via Stripe Connect when enabled.`,
        `Become a host in ${city}: onboarding, calendar, and guest messaging on LECIPM.`,
        `${aud}: explore host requirements before you publish.`,
      ];
      headlines = [
        learned[0] ?? `Host on BNHub · ${city}`,
        `List your rental`,
        `Start hosting`,
      ];
    }
  }

  return { primaryTexts, headlines, cta };
}

export function generateVideoScript(input: VideoScriptInput): GeneratedVideoScript {
  const city = input.city.trim() || "Montréal";
  const product = input.product ?? "bnhub";
  const hook =
    product === "bnhub"
      ? `First 3s: “Still comparing ${city} stays?” — show skyline + LECIPM logo sting.`
      : `First 3s: “${city} real estate — one platform.” — quick brand flash.`;

  const body =
    input.objective === "booking"
      ? `Mid: scroll real BNHub cards — price/night visible. Voice: calm, factual. No income guarantees.`
      : input.objective === "lead"
        ? `Mid: 2-step lead value — “We reply with options” — show form screenshot blurred.`
        : `Mid: host POV — calendar + “you control pricing” — verification disclaimer if shown.`;

  const cta = `End card: “${city} on LECIPM” + primary CTA (${input.objective === "host_acquisition" ? "List" : "Book / Learn more"}).`;

  return {
    hook,
    body,
    cta,
    sceneSuggestions: [
      `B-roll: ${city} neighbourhood exteriors (licensed or stock).`,
      "Screen capture: BNHub search → listing detail (no fake metrics).",
      "Close: trust line — Stripe-backed checkout where enabled.",
    ],
  };
}
