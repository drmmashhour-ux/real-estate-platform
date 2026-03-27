import { buildBaseSystem } from "../core/ai-prompts";
import type { AiIntent, AiMessages } from "../core/types";

export function buildBuyerAiMessages(intent: AiIntent, feature: string, context: Record<string, unknown>): AiMessages | null {
  const system = buildBaseSystem("buyer", intent);
  const userJson = JSON.stringify(context, null, 2);

  switch (feature) {
    case "search_assist":
      return {
        system:
          system +
          " Help refine search filters, neighborhoods, and property types. Ask clarifying questions only if essential.",
        user: `Task: Smart search assistance.\nContext:\n${userJson}`,
      };
    case "listing_insight":
      return {
        system:
          system +
          " Summarize strengths, possible concerns, rough affordability context (non-binding), and visible cost themes. Never guarantee investment performance.",
        user: `Task: Listing insight for a buyer.\nContext:\n${userJson}`,
      };
    case "contact_paths":
      return {
        system:
          system +
          " Explain differences between contacting the listing broker vs platform broker vs mortgage advice — neutral, no steering.",
        user: `Task: Explain contact paths before the buyer reaches out.\nContext:\n${userJson}`,
      };
    case "offer_readiness":
      return {
        system:
          system +
          " Summarize missing documents users often need; explain inspection / financing / closing timeline concepts briefly.",
        user: `Task: Offer readiness checklist (educational).\nContext:\n${userJson}`,
      };
    case "compare_listings":
      return {
        system:
          system +
          " Compare two or more listings on price, size, location, fees, and tradeoffs. Use only provided fields.",
        user: `Task: Side-by-side listing comparison.\nContext:\n${userJson}`,
      };
    case "filter_help":
      return {
        system:
          system +
          " Help the buyer choose search filters (budget, beds, property type, location). Ask at most one clarifying question.",
        user: `Task: Filter and search assistance.\nContext:\n${userJson}`,
      };
    case "affordability":
      return {
        system:
          system +
          " Explain affordability using list price and any income/down payment hints — illustrative only, not approval.",
        user: `Task: Affordability context (non-binding).\nContext:\n${userJson}`,
      };
    case "costs_warnings":
      return {
        system:
          system +
          " Summarize important one-time and recurring costs and common buyer warnings (taxes, welcome tax themes, inspections) using only context.",
        user: `Task: Costs and warnings summary.\nContext:\n${userJson}`,
      };
    case "legal_action_risk":
      return {
        system:
          system +
          " For a buyer about to request a platform broker or contact a listing: flag content-usage or disclosure gaps briefly. Not legal advice.",
        user: `Task: Buyer pre-action content-license risk.\nContext:\n${userJson}`,
      };
    default:
      return null;
  }
}

export function buyerOfflineFallback(feature: string, context: Record<string, unknown>): string {
  const title = typeof context.title === "string" ? context.title : "this listing";
  switch (feature) {
    case "search_assist":
      return `Offline mode: narrow by city, budget, beds/baths, and property type. Save favorites and compare commute or school priorities you care about. (${title})`;
    case "listing_insight":
      return `Offline mode: Review price vs similar homes, property age, monthly carrying costs on the listing, and disclosure documents when available. (${title})`;
    case "contact_paths":
      return `Offline mode: Listing brokers represent the seller; a platform broker may help you shop broadly; mortgage specialists discuss financing — each has a different role.`;
    case "offer_readiness":
      return `Offline mode: Expect pre-approval/verification, inspection windows, financing conditions, and deposit timing — confirm specifics with your broker and lawyer.`;
    case "compare_listings":
      return `Offline mode: Compare price per sq ft if available, location tradeoffs, and fee lines (taxes, condo) before deciding.`;
    case "filter_help":
      return `Offline mode: Start with city + budget, then beds/baths and property type; narrow with commute and must-have amenities.`;
    case "affordability":
      return `Offline mode: Rule-of-thumb: stress-test payment vs income; get a lender pre-approval for real limits.`;
    case "costs_warnings":
      return `Offline mode: Budget taxes, insurance, inspection, notary/legal, and moving — verify with your province’s rules.`;
    case "legal_action_risk":
      return `Offline mode: Add enough detail so brokers can help without you misrepresenting needs; keep requests truthful and complete.`;
    default:
      return `Offline AI: refine your question about ${feature} using listing facts and professional advice where needed.`;
  }
}
