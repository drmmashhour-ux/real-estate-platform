/**
 * Google Ads keyword ideas — match types + intent labels. No API calls.
 */

export type KeywordMatchType = "EXACT" | "PHRASE" | "BROAD";

export type KeywordRow = {
  keyword: string;
  matchType: KeywordMatchType;
  intent: "transactional" | "intent" | "hosting";
};

export type GoogleKeywordCategories = {
  transactional: KeywordRow[];
  intent: KeywordRow[];
  hosting: KeywordRow[];
};

export function generateGoogleKeywordCategories(city: string): GoogleKeywordCategories {
  const c = city.trim().toLowerCase().replace(/\s+/g, " ");
  const Cc = city.trim() || "Montréal";

  const transactional: KeywordRow[] = [
    { keyword: `book short term rental ${c}`, matchType: "PHRASE", intent: "transactional" },
    { keyword: `vacation rental ${c}`, matchType: "PHRASE", intent: "transactional" },
    { keyword: `nightly stay ${c}`, matchType: "PHRASE", intent: "transactional" },
    { keyword: `rent apartment weekend ${c}`, matchType: "BROAD", intent: "transactional" },
  ];

  const intent: KeywordRow[] = [
    { keyword: `airbnb alternative ${c}`, matchType: "PHRASE", intent: "intent" },
    { keyword: `lecipm ${c}`, matchType: "EXACT", intent: "intent" },
    { keyword: `bnb ${c} canada`, matchType: "PHRASE", intent: "intent" },
  ];

  const hosting: KeywordRow[] = [
    { keyword: `list vacation rental ${c}`, matchType: "PHRASE", intent: "hosting" },
    { keyword: `short term rental host ${c}`, matchType: "PHRASE", intent: "hosting" },
    { keyword: `rent my apartment ${c} short term`, matchType: "BROAD", intent: "hosting" },
  ];

  void Cc;
  return { transactional, intent, hosting };
}
