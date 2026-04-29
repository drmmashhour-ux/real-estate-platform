/** Listing analytics row kind — mirror of Prisma `ListingAnalyticsKind`. */

export const ListingAnalyticsKind = {
  FSBO: "FSBO",
  CRM: "CRM",
  BNHUB: "BNHUB",
} as const;

export type ListingAnalyticsKind = (typeof ListingAnalyticsKind)[keyof typeof ListingAnalyticsKind];
