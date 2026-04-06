import type { CityIntentKind } from "@/lib/growth/city-intent-seo";

/**
 * Deterministic SEO copy for programmatic city pages (no fabricated stats).
 */
export type CitySeoContent = {
  intro: string;
  /** Trust / platform value framing (non-numeric). */
  trustValue: string;
  /** Location / market exploration blurb (no implied statistics). */
  locationMarket: string;
  highlights: string[];
  tips: string[];
};

function categoryLabel(kind: CityIntentKind | undefined): string {
  switch (kind) {
    case "rent":
      return "long-term rentals";
    case "stays":
      return "short-term stays on BNHub";
    case "mortgage":
      return "financing-ready listings";
    case "investment":
      return "investment-oriented inventory";
    case "buy":
    default:
      return "homes for sale and broker-assisted listings";
  }
}

export function generateCityContent(city: string, category?: CityIntentKind): CitySeoContent {
  const c = city.trim() || "this market";
  const focus = categoryLabel(category);
  return {
    intro: `${c} is covered on LECIPM with live inventory you can filter by intent — currently emphasising ${focus}. Listings are presented with photos, structured detail, and secure contact options so you can compare before you commit to next steps.`,
    trustValue: `LECIPM keeps discovery and contact flows transparent: verified paths where applicable, clear unlock or inquiry steps, and separation between FSBO or broker-assisted sale pages and BNHub stay booking — so you always know which product surface you are on.`,
    locationMarket: `Use ${c}-scoped search and collection pages to narrow by price, beds, and property type, then open individual listings for maps, amenities, and representative contact. When data is missing on a row, the page shows what is available rather than guessing market averages.`,
    highlights: [
      `Browse ${focus} filtered for ${c} without creating an account first.`,
      `Structured listing pages with photos, pricing context, and secure contact or booking flows.`,
      category === "stays"
        ? `BNHub handles nightly stays separately from FSBO purchase listings — book only where checkout is offered.`
        : `Jump between buy, rent, and city hub pages to explore the same geography from different intents.`,
    ],
    tips: [
      `Save listings you like and revisit them from your account — useful when comparing ${c} options over a few days.`,
      category === "stays"
        ? `Confirm dates, guest count, and house rules on BNHub before you pay.`
        : `Short-term guests should use BNHub city pages for stays; purchase inquiries stay on listing detail contact flows.`,
      `For purchases, ask about timelines, inclusions, and any recent updates before you tour.`,
    ],
  };
}
