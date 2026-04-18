import type { BrokerSourceInstruction } from "./broker-sourcing.types";

/**
 * Human-operated sourcing checklist. No automated scraping or bots.
 */
export function getBrokerSourcingInstructions(city: string): BrokerSourceInstruction[] {
  const c = city.trim() || "[city]";

  return [
    {
      platform: "instagram",
      title: "Instagram",
      steps: [
        `Search: "real estate agent ${c}"`,
        "Look for active profiles posting listings",
        "Target agents with phone/email in bio",
      ],
      searchQueries: [`real estate agent ${c}`],
    },
    {
      platform: "linkedin",
      title: "LinkedIn",
      steps: [
        `Search: "real estate broker ${c}"`,
        "Filter by location",
        "Connect + message",
      ],
      searchQueries: [`real estate broker ${c}`],
    },
    {
      platform: "facebook",
      title: "Facebook",
      steps: [
        `Groups: "Real Estate ${c}"`,
        `"Buy/Sell Homes ${c}"`,
        "Find active agents in posts/comments",
      ],
      searchQueries: [`Real Estate ${c}`, `Buy/Sell Homes ${c}`],
    },
    {
      platform: "google_maps",
      title: "Google Maps",
      steps: [
        `Search: "real estate agent ${c}"`,
        "Open top agencies",
        "Extract agent names and contact",
      ],
      searchQueries: [`real estate agent ${c}`],
    },
    {
      platform: "brokerage_websites",
      title: "Brokerage sites",
      steps: [
        "Visit RE/MAX, Century 21, etc.",
        "Look at agent directories",
        "Collect contact info",
      ],
      searchQueries: [`RE/MAX ${c} agents`, `Century 21 ${c}`],
    },
  ];
}
