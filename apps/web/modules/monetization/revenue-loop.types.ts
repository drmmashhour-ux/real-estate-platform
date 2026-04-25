/** DTOs for client / API; keep in sync with `revenue-loop.service.ts`. */
export type SimilarLeadRowDto = {
  id: string;
  listingId: string;
  region: string | null;
  priceCad: string;
  score: number;
  href: string;
  createdAt: string;
};

export type UrgencySignalsDto = {
  engagedBrokersInWindow: number;
  windowHours: number;
  showEngagedBrokers: boolean;
  isRecentlyAdded: boolean;
  leadCreatedAt: string;
  regionPeerLeadCount: number | null;
};

export type RevenueLoopForLeadDto = {
  similarLeads: SimilarLeadRowDto[];
  urgency: UrgencySignalsDto;
  showPremiumTeaser: boolean;
  showBulkBundleHint: boolean;
  bundleProgress: { current: number; target: 3; discountPercent: number; windowDays: number };
  purchaseCount90d: number;
  premiumMonthlyCad: number;
  premiumBenefits: string[];
  disclaimer: string;
};
