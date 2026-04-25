export interface SourcingTip {
  platform: string;
  queries: string[];
  filters: string[];
  proTip: string;
}

export const SOURCING_GUIDE: SourcingTip[] = [
  {
    platform: "INSTAGRAM",
    queries: [
      "real estate montreal",
      "courtier immobilier montreal",
      "real estate laval",
      "courtier immobilier quebec"
    ],
    filters: [
      "Check recent tags #courtierimmobilier",
      "Look for active stories (high engagement signal)",
      "Check bio for 'Montreal' or agency names"
    ],
    proTip: "Look for brokers posting walkthrough videos - they are active and marketing-savvy."
  },
  {
    platform: "LINKEDIN",
    queries: [
      "Real Estate Broker Montreal",
      "Courtier immobilier Laval",
      "Directeur d'agence immobilière"
    ],
    filters: [
      "Location: Greater Montreal Area",
      "Connection Level: 2nd or 3rd",
      "Activity: Posted in the last 30 days"
    ],
    proTip: "Target brokers with 'Residential' specialty in their title for higher LECIPM relevance."
  },
  {
    platform: "GOOGLE_MAPS",
    queries: [
      "agences immobilières montreal",
      "real estate agency laval",
      "courtier indépendant brossard"
    ],
    filters: [
      "Open agency websites → find team page",
      "Look for independent brokers with personal branding"
    ],
    proTip: "Smaller independent agencies are often faster decision-makers than large franchises."
  }
];

export function getSourcingGuide() {
  return SOURCING_GUIDE;
}
