import type { AdSetupPlan } from "./ads-setup.types";

const CITY_TOKEN = "[CITY]";

/**
 * $50 starter plan — planning only; operator enters budget in Meta Ads UI manually.
 */
export function buildStarterAdsPlan(city: string): AdSetupPlan {
  const cityLabel = city.trim() || CITY_TOKEN;

  const primary = `Looking to buy a home in ${cityLabel}?

Get access to exclusive listings and connect with top real estate agents.

Start your search today.`;

  return {
    platform: "facebook",
    budgetTotal: 50,
    dailyBudget: 10,
    durationDays: 5,
    targeting: [
      `location: ${cityLabel}`,
      "age: 25–55",
      "interests: real estate, home buying, property investment",
    ],
    copy: primary,
    cta: "Get Listings",
  };
}
