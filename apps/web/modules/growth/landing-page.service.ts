import type { LandingPageTemplate } from "./landing-page.types";

export function buildBuyerLandingPage(city: string): LandingPageTemplate {
  const c = city.trim() || "[CITY]";

  return {
    id: `buyer-landing-fast-deal-v2-${c.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9-]/g, "") || "city"}`,
    headline: `Find Your Next Home in ${c}`,
    subheadline: "Browse listings and get matched with top real estate agents.",
    sections: [
      {
        title: "Exclusive Listings",
        content: "Access homes you won't find everywhere.",
      },
      {
        title: "Top Agents",
        content: "Work with experienced local brokers.",
      },
      {
        title: "Fast Process",
        content: "Get matched and start visiting properties quickly.",
      },
    ],
    cta: "Get Listings Now",
  };
}
