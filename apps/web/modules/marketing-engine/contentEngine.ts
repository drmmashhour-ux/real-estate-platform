import { randomUUID } from "crypto";
import type { GrowthCitySlug } from "@/lib/growth/geo-slugs";
import { growthCityDisplayName, growthCityRegion } from "@/lib/growth/geo-slugs";
import { generateSeoPageContentDraft } from "@/modules/growth-engine/seoContentGenerator";

export type MarketingEngineTopicKey =
  | "property_highlights"
  | "city_insights"
  | "investment_tips"
  | "market_update";

const APP_URL = () => (process.env.NEXT_PUBLIC_APP_URL ?? "https://lecipm.com").replace(/\/$/, "");

/** Short listing-oriented copy for social + email snippets (deterministic; swap for LLM). */
export function generatePropertyHighlights(input: {
  city: string;
  listingTitle?: string | null;
  listingPath?: string | null;
}): string {
  const city = input.city.trim() || "Montreal";
  const title = input.listingTitle?.trim() || "Featured inventory";
  const path = input.listingPath?.trim() || "/buy";
  const url = `${APP_URL()}${path.startsWith("/") ? path : `/${path}`}`;
  return [
    `${title} in ${city} — verified presentation, clear pricing context, and BNHub-compatible travel demand signals on LECIPM.`,
    `Browse similar homes and short stays in one stack: ${url}`,
    `Tip: compare carrying costs vs. flexible stays before you lock a closing date.`,
  ].join("\n\n");
}

/** Pulls from programmatic SEO blocks for consistency with city landing pages. */
export function generateCityInsights(citySlug: GrowthCitySlug): string {
  const name = growthCityDisplayName(citySlug);
  const d = generateSeoPageContentDraft(citySlug, "rent");
  return [
    `${name} — city pulse`,
    d.blockBestProperties,
    `Investment angle: ${d.blockTopInvestment.slice(0, 400)}${d.blockTopInvestment.length > 400 ? "…" : ""}`,
    `Hub: ${APP_URL()}/city/${citySlug}`,
  ].join("\n\n");
}

export function generateInvestmentTips(citySlug: GrowthCitySlug): string {
  const name = growthCityDisplayName(citySlug);
  const region = growthCityRegion(citySlug);
  const d = generateSeoPageContentDraft(citySlug, "investment");
  return [
    `Investment tips — ${name} (${region})`,
    d.blockTopInvestment,
    `Rent vs buy context: ${d.blockRentVsBuy.slice(0, 500)}${d.blockRentVsBuy.length > 500 ? "…" : ""}`,
    `Stress-test every deal on LECIPM before you waive conditions.`,
  ].join("\n\n");
}

/** Time-stamped “market update” blurb for newsletter + blog intros. */
export function generateMarketUpdate(citySlug: GrowthCitySlug): string {
  const name = growthCityDisplayName(citySlug);
  const week = new Date().toISOString().slice(0, 10);
  const d = generateSeoPageContentDraft(citySlug, "buy");
  return [
    `Market update — ${name} — ${week} (UTC)`,
    `Buyer demand: ${d.blockBestProperties.slice(0, 380)}${d.blockBestProperties.length > 380 ? "…" : ""}`,
    `Listing discovery: ${APP_URL()}/city/${citySlug} · FSBO + BNHub inventory refreshes daily.`,
    `Run ID: ${randomUUID().slice(0, 8)}`,
  ].join("\n\n");
}

/** Single-line social variant (X-friendly length cap). */
export function toSocialSnippet(full: string, maxLen = 260): string {
  const t = full.replace(/\s+/g, " ").trim();
  if (t.length <= maxLen) return t;
  return `${t.slice(0, maxLen - 1)}…`;
}
