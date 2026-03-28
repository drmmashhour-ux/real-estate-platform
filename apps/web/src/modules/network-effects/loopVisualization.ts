/**
 * Textual flywheel for admin dashboard (Mermaid-friendly).
 */
export const NETWORK_EFFECT_LOOP_MERMAID = `flowchart LR
  Supply[Supply: brokers + hosts] --> Trust[Trust + verification]
  Trust --> Listings[Quality listings]
  Listings --> SEO[SEO + city / neighborhood pages]
  SEO --> Demand[Demand + leads]
  Demand --> Revenue[Revenue + data]
  Revenue --> Supply
`;

export function describeNetworkLoop(metrics: {
  listingsPublished: number;
  usersGrowth30d: number;
  leads30d: number;
}): string {
  return [
    `Published stays anchor organic demand (${metrics.listingsPublished} live).`,
    `New accounts feed the referral and host pipeline (+${metrics.usersGrowth30d} users / 30d).`,
    `Lead flow validates conversion (${metrics.leads30d} leads / 30d) — tighten supply in hot corridors.`,
  ].join(" ");
}
