import type { CityIntentKind } from "@/lib/growth/city-intent-seo";

export type CityAiMarketingResult = {
  enabled: boolean;
  headline: string;
  body: string;
  source: "off" | "template" | "openai";
};

function templateCopy(city: string, intent: CityIntentKind, inventoryCount: number): Omit<CityAiMarketingResult, "enabled" | "source"> {
  const inv =
    inventoryCount > 0
      ? `Right now we’re surfacing ${inventoryCount}+ curated paths to book or buy in this market.`
      : "Inventory refreshes often — save a search or set a price alert so you don’t miss drops.";
  if (intent === "mortgage") {
    return {
      headline: `Smarter financing in ${city}`,
      body: `Compare pre-approval paths, stress-test payments, and keep BNHub stays or FSBO buys in one workspace — built to reduce back-and-forth.`,
    };
  }
  if (intent === "investment") {
    return {
      headline: `Acquisition lens for ${city}`,
      body: `Stack FSBO asks, short-stay yield signals, and structured FAQs — then validate assumptions with licensed pros before you wire funds.`,
    };
  }
  if (intent === "rent") {
    return {
      headline: `Stays in ${city}, without the noise`,
      body: `BNHub filters by dates, guests, and neighbourhood intent. ${inv}`,
    };
  }
  if (intent === "stays") {
    return {
      headline: `Book a stay in ${city}`,
      body: `Short-term inventory on BNHub with dates-first search. ${inv}`,
    };
  }
  return {
    headline: `Buy & browse ${city} with guardrails`,
    body: `FSBO transparency plus BNHub stays in one mesh. ${inv}`,
  };
}

async function fetchOpenAiBlurb(input: {
  city: string;
  intent: CityIntentKind;
  inventoryCount: number;
}): Promise<string | null> {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return null;

  const model = process.env.MARKETPLACE_CITY_COPY_MODEL?.trim() || "gpt-4o-mini";
  const prompt = `Write 2 short sentences for a real-estate marketplace city landing page. City: ${input.city}. Intent: ${input.intent}. Approx live inventory items shown on page: ${input.inventoryCount}. Tone: confident, plain language, no superlatives, no legal promises. Focus on discovery + booking speed + trust.`;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 180,
        temperature: 0.65,
      }),
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = data.choices?.[0]?.message?.content?.trim();
    return text && text.length > 20 ? text : null;
  } catch {
    return null;
  }
}

/**
 * Optional AI/template marketing block for programmatic city pages.
 * - Set MARKETPLACE_AI_CITY_COPY=1 to show template (or OpenAI when OPENAI_API_KEY is set).
 */
export async function getCityAiMarketingCopy(input: {
  slug: string;
  intent: CityIntentKind;
  city: string;
  inventoryCount: number;
}): Promise<CityAiMarketingResult> {
  void input.slug;
  const enabled = process.env.MARKETPLACE_AI_CITY_COPY?.trim() === "1";
  if (!enabled) {
    return { enabled: false, headline: "", body: "", source: "off" };
  }

  const t = templateCopy(input.city, input.intent, input.inventoryCount);
  const ai = await fetchOpenAiBlurb({
    city: input.city,
    intent: input.intent,
    inventoryCount: input.inventoryCount,
  });

  if (ai) {
    return {
      enabled: true,
      headline: t.headline,
      body: ai,
      source: "openai",
    };
  }

  return {
    enabled: true,
    headline: t.headline,
    body: t.body,
    source: "template",
  };
}
