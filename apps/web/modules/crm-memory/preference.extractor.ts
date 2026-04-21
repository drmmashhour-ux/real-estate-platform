const BUDGET_RE =
  /\$?\s*(\d{2,4})\s*[kK](?:\s*[-–]\s*\$?\s*(\d{2,4})\s*[kK])?(?:\b|\s*(?:CAD|usd)?)/;
const PRICE_RANGE_RE = /\b(\d{3})\s*k\s*[-–]\s*(\d{3})\s*k\b/i;
const CITY_RE = /\b(Montreal|Montréal|Laval|Longueuil|Quebec City|Québec)\b/i;
const TYPE_RE = /\b(condo|condominium|single[-\s]?family|duplex|triplex|townhouse|plex)\b/i;

export type ExtractedPreferences = {
  budgetLabel: string | null;
  preferredArea: string | null;
  propertyType: string | null;
};

export function extractPreferencesFromTexts(texts: string[]): ExtractedPreferences {
  const blob = texts.join("\n").slice(-12000);
  let budgetLabel: string | null = null;
  const pr = blob.match(PRICE_RANGE_RE);
  if (pr) {
    budgetLabel = `$${pr[1]}k–$${pr[2]}k`;
  } else {
    const b = blob.match(BUDGET_RE);
    if (b) {
      budgetLabel = b[2] ? `$${b[1]}k–$${b[2]}k` : `~$${b[1]}k`;
    }
  }
  const city = blob.match(CITY_RE);
  const typ = blob.match(TYPE_RE);
  return {
    budgetLabel,
    preferredArea: city ? city[1]!.replace(/\s+/g, " ").trim() : null,
    propertyType: typ ? typ[1]!.replace(/\s+/g, " ").trim() : null,
  };
}
