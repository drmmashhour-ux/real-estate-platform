import type { AdDraft } from "./ads-engine.types";

const CITY_TOKEN = "[CITY]";

function slugCity(city: string): string {
  return city.trim().replace(/\s+/g, "-").replace(/[^a-zA-Z0-9-]/g, "") || "city";
}

/**
 * Draft-only ad assets for human export. No ad platform API calls.
 */
export function generateAdDrafts(city: string = CITY_TOKEN): AdDraft[] {
  const cityLabel = city.trim() || CITY_TOKEN;
  const slug = slugCity(cityLabel);

  return [
    {
      id: `facebook-buyer-${slug}`,
      platform: "facebook",
      title: `Looking to buy a home in ${cityLabel}?`,
      description:
        "Get access to exclusive listings and connect with top agents. Start your search today.",
      targeting: [
        "location: city",
        "age: 25–55",
        "interests: real estate, home buying, property investment",
      ],
      intent: "buyer",
    },
    {
      id: `google-buyer-${slug}`,
      platform: "google",
      title: `Google Search — buyer (${cityLabel})`,
      description: `Find your next home in ${cityLabel}. Browse listings and connect with top agents today.`,
      targeting: [
        `Keywords: buy home ${cityLabel}`,
        `Keywords: real estate agents ${cityLabel}`,
        `Keywords: property for sale ${cityLabel}`,
      ],
      intent: "buyer",
    },
  ];
}
