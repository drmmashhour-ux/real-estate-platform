export const investorStory = {
  title: "LECIPM Autonomous Real Estate Marketplace",
  sections: [
    {
      name: "Marketplace",
      message: "Listings, bookings, users, and revenue are tracked in real time.",
    },
    {
      name: "AI Pricing",
      message: "Dynamic pricing adjusts listings based on occupancy and demand.",
    },
    {
      name: "Compliance",
      message: "OACIQ-related checks block incomplete or risky listings before publication.",
    },
    {
      name: "Growth",
      message: "The platform detects funnel weaknesses and recommends revenue actions.",
    },
    {
      name: "Trust",
      message: "Trust scoring flags weak or suspicious listings before they harm conversion.",
    },
  ],
} as const;

export type InvestorStory = typeof investorStory;
