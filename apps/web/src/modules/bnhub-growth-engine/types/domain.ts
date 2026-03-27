import type {
  BnhubGrowthAutonomyLevel,
  BnhubGrowthCampaignStatus,
  BnhubGrowthConnectorStatus,
  BnhubGrowthDistributionStatus,
  BnhubLeadSourceType,
  BnhubLeadStatus,
  BnhubLeadTemperature,
} from "@prisma/client";

export type GrowthCampaignSummary = {
  id: string;
  listingId: string;
  hostUserId: string;
  campaignName: string;
  status: BnhubGrowthCampaignStatus;
  autonomyLevel: BnhubGrowthAutonomyLevel;
};

export type GrowthDistributionSummary = {
  id: string;
  campaignId: string;
  connectorCode: string;
  distributionStatus: BnhubGrowthDistributionStatus;
  impressions: number;
  clicks: number;
  leads: number;
  spendCents: number;
};

export type GrowthLeadSummary = {
  id: string;
  sourceType: BnhubLeadSourceType;
  leadScore: number;
  leadTemperature: BnhubLeadTemperature;
  status: BnhubLeadStatus;
};

export type WebhookNormalizedLeadPayload = {
  sourceType: BnhubLeadSourceType;
  sourceConnectorCode?: string | null;
  externalLeadRef?: string | null;
  fullName?: string | null;
  email?: string | null;
  phone?: string | null;
  message?: string | null;
  listingId?: string | null;
  campaignId?: string | null;
  distributionId?: string | null;
  hostUserId?: string | null;
};

export type OptimizationResult = {
  pausedCampaigns: number;
  recommendationsCreated: number;
  metricsSynced: number;
};

export type ConnectorHealthcheckResult = {
  connectorCode: string;
  ok: boolean;
  message: string;
  status: BnhubGrowthConnectorStatus;
};
