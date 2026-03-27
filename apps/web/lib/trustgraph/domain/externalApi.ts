export type ExternalListingTrustDto = {
  listingId: string;
  trustLevel: string | null;
  readinessLevel: string | null;
  badges: string[];
  missingItemsSummary: string[];
};

export type ExternalMortgageReadinessDto = {
  mortgageRequestId: string;
  readinessSummary: string;
  missingItemsSummary: string[];
};

export type ExternalBrokerTrustDto = {
  brokerId: string;
  verificationLabel: string;
  missingItemsSummary: string[];
};
