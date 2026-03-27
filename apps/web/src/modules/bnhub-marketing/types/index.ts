import type {
  BnhubMarketingAsset,
  BnhubMarketingCampaign,
  BnhubMarketingCampaignObjective,
  BnhubMarketingCampaignStatus,
  BnhubCampaignDistribution,
  BnhubDistributionChannel,
  BnhubListingMarketingProfile,
  BnhubMarketingRecommendation,
  BnhubMarketingEvent,
} from "@prisma/client";

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

export type CampaignListRow = BnhubMarketingCampaign & {
  listing: {
    id: string;
    title: string;
    city: string | null;
    listingCode: string | null;
    nightPriceCents: number | null;
  };
};

export type CampaignDetail = BnhubMarketingCampaign & {
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
  distributions: (BnhubCampaignDistribution & { channel: BnhubDistributionChannel })[];
  recommendations: BnhubMarketingRecommendation[];
  events: BnhubMarketingEvent[];
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
