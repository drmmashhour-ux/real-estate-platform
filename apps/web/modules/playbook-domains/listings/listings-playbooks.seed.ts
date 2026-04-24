export const listingsPlaybookSeeds = [
  {
    key: "wave11_listing_ranking_context_v1",
    name: "Contextual listing ranking (ranking only)",
    domain: "LISTINGS" as const,
    actionType: "listing_ranking_adjust",
    description: "Adjusts search/listing ordering only; no messaging.",
  },
] as const;
