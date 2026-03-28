import { prisma } from "@/lib/db";
import {
  RANKING_LISTING_TYPE_BNHUB,
  RANKING_LISTING_TYPE_REAL_ESTATE,
  RANKING_LISTING_TYPE_CRM,
} from "@/src/modules/ranking/dataMap";

const BNHUB_WEIGHTS = {
  relevance: 0.22,
  trust: 0.14,
  quality: 0.1,
  engagement: 0.08,
  conversion: 0.12,
  freshness: 0.07,
  host: 0.12,
  review: 0.1,
  priceCompetitiveness: 0.03,
  availability: 0.02,
};

const REAL_ESTATE_WEIGHTS = {
  relevance: 0.24,
  trust: 0.16,
  quality: 0.14,
  engagement: 0.12,
  conversion: 0.14,
  freshness: 0.08,
  host: 0.02,
  review: 0.02,
  priceCompetitiveness: 0.06,
  availability: 0.02,
};

const CRM_WEIGHTS = {
  relevance: 0.15,
  trust: 0.08,
  quality: 0.06,
  engagement: 0.05,
  conversion: 0.05,
  freshness: 0.28,
  host: 0.03,
  review: 0.03,
  priceCompetitiveness: 0.22,
  availability: 0.05,
};

/**
 * Idempotent seed for default ranking profiles (distinct emphasis vs legacy SearchRankingConfig).
 */
export async function seedDefaultRankingConfigs(): Promise<void> {
  await prisma.rankingConfig.upsert({
    where: { configKey: "default_bnhub_ranking" },
    create: {
      configKey: "default_bnhub_ranking",
      listingType: RANKING_LISTING_TYPE_BNHUB,
      weightsJson: BNHUB_WEIGHTS,
      isActive: true,
    },
    update: { weightsJson: BNHUB_WEIGHTS, isActive: true, listingType: RANKING_LISTING_TYPE_BNHUB },
  });

  await prisma.rankingConfig.upsert({
    where: { configKey: "default_real_estate_ranking" },
    create: {
      configKey: "default_real_estate_ranking",
      listingType: RANKING_LISTING_TYPE_REAL_ESTATE,
      weightsJson: REAL_ESTATE_WEIGHTS,
      isActive: true,
    },
    update: {
      weightsJson: REAL_ESTATE_WEIGHTS,
      isActive: true,
      listingType: RANKING_LISTING_TYPE_REAL_ESTATE,
    },
  });

  await prisma.rankingConfig.upsert({
    where: { configKey: "default_lecipm_crm_ranking" },
    create: {
      configKey: "default_lecipm_crm_ranking",
      listingType: RANKING_LISTING_TYPE_CRM,
      weightsJson: CRM_WEIGHTS,
      isActive: true,
    },
    update: { weightsJson: CRM_WEIGHTS, isActive: true, listingType: RANKING_LISTING_TYPE_CRM },
  });
}
