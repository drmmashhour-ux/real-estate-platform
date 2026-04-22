/** Hub slugs supported under `/dashboard/admin/hubs/[hub]`. */
export const hubDefinitions = [
  { slug: "buyer", title: "Buyer Hub" },
  { slug: "seller", title: "Seller Hub" },
  { slug: "broker", title: "Broker Hub" },
  { slug: "investor", title: "Investor Hub" },
  { slug: "bnhub", title: "BNHub" },
  { slug: "rent", title: "Rent Hub" },
] as const;

export type HubSlug = (typeof hubDefinitions)[number]["slug"];

export function isHubSlug(value: string): value is HubSlug {
  return hubDefinitions.some((h) => h.slug === value);
}
