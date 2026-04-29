import type {
  BnhubDistributionRowView,
  BnhubListingMarketingProfile,
  BnhubMarketingAsset,
  BnhubMarketingCampaignObjective,
  BnhubMarketingCampaignStatus,
  BnhubMarketingRecommendation,
} from "@/types/bnhub-client-models";

export type MarketingOverviewResponse = {
  totalCampaigns: number;
  activeCampaigns: number;
  channelPerf: {
    channel: string;
    impressions: number;
    clicks: number;
    bookings: number;
    revenueAttributedCents: number;
  }[];
  estimatedReach: number;
  estimatedBookingsInfluenced: number;
  recommendationAlerts: number;
  labels: { reach: string; bookings: string };
};

export type CampaignListRow = {
  id: string;
  campaignName: string;
  status: BnhubMarketingCampaignStatus;
  objective?: BnhubMarketingCampaignObjective | null;
  listing: {
    id: string;
    title: string;
    city: string | null;
    listingCode: string | null;
    nightPriceCents: number | null;
  };
};

/** API campaign detail bundle for host/admin marketing UX (no `@prisma/client`). */
export type BnhubMarketingEventView = {
  id: string;
  eventType: string;
  createdAt?: Date | string | null;
  payload?: unknown;
};

export type CampaignDetail = {
  id: string;
  campaignName: string;
  objective: BnhubMarketingCampaignObjective | null;
  status: BnhubMarketingCampaignStatus;
  listing: {
    id: string;
    title: string;
    city: string | null;
    listingCode: string | null;
    nightPriceCents: number | null;
    photos: unknown;
    ownerId: string;
  };
  assets: BnhubMarketingAsset[];
  distributions: BnhubDistributionRowView[];
  recommendations: BnhubMarketingRecommendation[];
  events: BnhubMarketingEventView[];
};

export type ListingMarketingBundle = {
  profile: BnhubListingMarketingProfile | null;
  recommendations: BnhubMarketingRecommendation[];
  stats: {
    campaigns: number;
    impressions: number;
    clicks: number;
    leads: number;
    bookings: number;
    revenueAttributedCents: number;
  };
};

export type CampaignObjective = BnhubMarketingCampaignObjective;
export type CampaignStatus = BnhubMarketingCampaignStatus;
