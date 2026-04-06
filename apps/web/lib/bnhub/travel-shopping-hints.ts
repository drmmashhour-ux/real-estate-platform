/**
 * Travel & vacation AI: compares user-provided quotes and trip intent.
 * Does not fetch live fares or scrape third-party sites.
 */

import { isOpenAiConfigured, openai } from "@/lib/ai/openai";

export type TravelShoppingMode = "flight" | "package";

export type TravelShoppingHintsResult = {
  mode: TravelShoppingMode;
  /** Short hook for the results card */
  headline: string;
  bullets: string[];
  checklist: string[];
  /** Phrases guests can paste into airline / tour-operator search boxes */
  searchPhrases: string[];
  /** One line on timing / early planning (no invented savings %) */
  whyBookEarly: string;
  /** Soft cross-sell: pre/post stay on the platform */
  staysHook: string;
  disclaimer: string;
  source: "openai" | "fallback";
};

const DISCLAIMER =
  "Tips are educational only. Prices and inventory change by the minute. Always confirm totals, baggage, transfers, and cancellation rules on the official site before you pay.";

function fallbackHints(mode: TravelShoppingMode, summary: string): TravelShoppingHintsResult {
  const bullets =
    mode === "flight"
      ? [
          "Open the airline’s own site and one metasearch you trust; compare the same dates, cabin, and bag rules side by side.",
          "Basic economy can exclude seat choice and carry-on — add those costs before you decide what’s cheapest.",
          "Long layovers or secondary airports can explain a much lower fare; check total travel time and transfer risk.",
          "Screenshot or save the fare rules at checkout so you have proof if the offer changes.",
        ]
      : [
          "Ask exactly what “all-inclusive” covers: which restaurants, drink tier, minibar, tips, and airport transfer.",
          "Compare room category on a map; “garden view” and “oceanfront” are priced for a reason.",
          "Check change and refund windows — packages often have stricter rules than flights alone.",
          "If a deal is far below similar weeks, verify operator, dates, and that taxes are included in the headline price.",
        ];

  const searchPhrases =
    mode === "flight"
      ? [
          `${summary} flexible dates`,
          `${summary} direct only`,
          `${summary} carry-on included`,
        ]
      : [
          `${summary} all-inclusive taxes included`,
          `${summary} airport transfer`,
          `${summary} refundable deposit`,
        ];

  return {
    mode,
    headline:
      mode === "flight"
        ? "Sharpen your flight comparison before you pay"
        : "Make sure your package price matches what you expect",
    bullets,
    checklist:
      mode === "flight"
        ? ["Passport validity", "Bag weight limits", "Seat fees", "Change fee tier", "Travel insurance"]
        : ["Deposit & final payment dates", "Transfer included?", "Hurricane / weather policy", "Excursion refunds"],
    searchPhrases,
    whyBookEarly:
      "Planning further ahead usually means more flight times and room types to choose from — especially around holidays and school breaks.",
    staysHook:
      "Bookending a package with a night or two near the airport or downtown? Browse BNHub stays for flexible local hosts.",
    disclaimer: DISCLAIMER,
    source: "fallback",
  };
}

export async function generateTravelShoppingHints(input: {
  mode: TravelShoppingMode;
  /** e.g. "YUL–CUN March 12–19" */
  routeOrTripSummary: string;
  /** User-pasted quotes, email snippets, or notes — optional */
  pastedNotes?: string;
}): Promise<TravelShoppingHintsResult> {
  const summary = input.routeOrTripSummary.trim().slice(0, 500);
  const notes = (input.pastedNotes ?? "").trim().slice(0, 4000);
  if (!summary) return fallbackHints(input.mode, summary);

  const baseFallback = fallbackHints(input.mode, summary);

  if (!isOpenAiConfigured()) {
    return baseFallback;
  }

  try {
    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.45,
      max_tokens: 700,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are the travel planning assistant for a real-estate and short-term rental platform (BNHub) that also helps users plan trips ethically.

Hard rules:
- Never invent current prices, fare classes, or claim you browsed a website.
- Never promise commissions, discounts, or exclusive rates from airlines (WestJet, Sunwing, etc.) unless the user pasted that text.
- Do not output URLs (links are added separately by the app).
- Encourage users to verify everything on official airline or tour-operator sites.
- Tone: confident, friendly, concise — help them feel smart and in control (builds trust and retention).

Return JSON only:
{
  "headline": string (max 90 chars, specific to their trip summary),
  "bullets": string[] (4-5 items, actionable comparison tips),
  "checklist": string[] (5-6 short items to tick before paying),
  "searchPhrases": string[] (3-4 phrases they can paste into search boxes on airline or package sites; include origin/destination/dates from their summary when known),
  "whyBookEarly": string (one sentence; no fake percentages),
  "staysHook": string (one sentence suggesting a BNHub stay for pre/post trip nights near hub cities or resorts — do not claim BNHub has flights)
}`,
        },
        {
          role: "user",
          content: JSON.stringify({
            mode: input.mode,
            routeOrTripSummary: summary,
            pastedNotes: notes || undefined,
          }),
        },
      ],
    });
    const raw = res.choices[0]?.message?.content;
    if (!raw) return baseFallback;
    const parsed = JSON.parse(raw) as {
      headline?: unknown;
      bullets?: unknown;
      checklist?: unknown;
      searchPhrases?: unknown;
      whyBookEarly?: unknown;
      staysHook?: unknown;
    };
    const headline =
      typeof parsed.headline === "string" ? parsed.headline.trim().slice(0, 120) : baseFallback.headline;
    const bullets = Array.isArray(parsed.bullets)
      ? parsed.bullets.filter((x): x is string => typeof x === "string").slice(0, 5)
      : [];
    const checklist = Array.isArray(parsed.checklist)
      ? parsed.checklist.filter((x): x is string => typeof x === "string").slice(0, 6)
      : [];
    const searchPhrases = Array.isArray(parsed.searchPhrases)
      ? parsed.searchPhrases.filter((x): x is string => typeof x === "string").slice(0, 4)
      : [];
    const whyBookEarly =
      typeof parsed.whyBookEarly === "string" ? parsed.whyBookEarly.trim().slice(0, 400) : baseFallback.whyBookEarly;
    const staysHook =
      typeof parsed.staysHook === "string" ? parsed.staysHook.trim().slice(0, 400) : baseFallback.staysHook;

    if (bullets.length === 0) return baseFallback;

    return {
      mode: input.mode,
      headline: headline || baseFallback.headline,
      bullets,
      checklist: checklist.length ? checklist : baseFallback.checklist,
      searchPhrases: searchPhrases.length ? searchPhrases : baseFallback.searchPhrases,
      whyBookEarly,
      staysHook,
      disclaimer: DISCLAIMER,
      source: "openai",
    };
  } catch {
    return baseFallback;
  }
}
