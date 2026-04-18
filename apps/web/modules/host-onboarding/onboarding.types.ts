export type CreateHostLeadInput = {
  name?: string;
  email?: string;
  phone?: string;
  city?: string;
  propertyType?: string;
  listingUrl?: string;
  source?: string;
  sourceDetail?: string;
  estimatedRevenueCents?: number;
  userId?: string | null;
};

export type OnboardingStepInput = {
  sessionId: string;
  stepKey: string;
  data: Record<string, unknown>;
};

export type ListingImportInput = {
  sourcePlatform: string;
  sourceUrl: string;
  leadId?: string | null;
  userId?: string | null;
};
