import type { PropertyIntent, SeoHub, SeoKeywordPlan } from "./seo-engine.types";

function normalizeCity(city: string): string {
  const t = city.trim();
  return t.length ? t : "your area";
}

/**
 * Builds a keyword cluster for programmatic SEO pages without claiming inventory availability.
 */
export function buildKeywordPlan(params: {
  city: string;
  neighborhood?: string;
  propertyType?: string;
  intent: PropertyIntent;
  hub: SeoHub;
}): SeoKeywordPlan {
  const city = normalizeCity(params.city);
  const nb = params.neighborhood?.trim();
  const pt = params.propertyType?.trim().toLowerCase() || "homes";
  const geo = nb ? `${nb}, ${city}` : city;

  let primaryKeyword = `${pt} ${city}`;
  let angle =
    "Highlight accurate location context and how LECIPM helps buyers and renters discover vetted listings — avoid implying availability counts.";

  if (params.hub === "bnhub") {
    primaryKeyword = `short-term stays ${city}`;
    angle =
      "Focus on neighborhood character and booking discovery on LECIPM BNHub — no occupancy or revenue guarantees.";
  }
  if (params.hub === "investor") {
    primaryKeyword = `investment properties ${city}`;
    angle =
      "Educational framing: due diligence, market context, and platform tools — not performance promises.";
  }
  if (params.hub === "residence_services") {
    primaryKeyword = `residence services ${city}`;
    angle =
      "Real estate and residence-services coordination only — services delivered by residences; no medical or clinical claims.";
  }
  if (params.intent === "luxury") {
    primaryKeyword = `luxury ${pt} ${city}`;
    angle = "Premium positioning with truthful location signals — avoid exaggerated scarcity.";
  }
  if (params.intent === "rent") {
    primaryKeyword = `rent ${pt} ${city}`;
  }
  if (params.intent === "short_term_stay") {
    primaryKeyword = `short-term rentals ${geo}`;
  }

  const secondary: string[] = [
    `${city} real estate`,
    `LECIPM ${city}`,
    `${geo} property search`,
  ];
  if (params.hub === "bnhub") {
    secondary.push(`BNHub ${city}`, `vacation rental ${city}`);
  }
  if (params.hub === "investor") {
    secondary.push(`${city} market overview`, `rental yield research ${city}`);
  }

  const longTail: string[] = [
    `best neighborhoods for ${pt} near ${city}`,
    `how to search ${pt} in ${city} on LECIPM`,
  ];
  if (nb) {
    longTail.push(`${pt} near ${nb} ${city}`);
  }

  return {
    primaryKeyword,
    secondaryKeywords: secondary.slice(0, 8),
    longTailVariants: longTail.slice(0, 6),
    contentAngle: angle,
  };
}
