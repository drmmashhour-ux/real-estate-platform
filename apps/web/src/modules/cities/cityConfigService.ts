import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { normalizeCityKey } from "@/src/modules/cities/cityNormalizer";

export type CityFeatureKey =
  | "rankingEnabled"
  | "messagingEnabled"
  | "autonomousCloserEnabled"
  | "fraudDetectionEnabled"
  | "reviewSystemEnabled"
  | "bnhubEnabled"
  | "realEstateEnabled";

const DEFAULT_FEATURES: Record<CityFeatureKey, boolean> = {
  rankingEnabled: true,
  messagingEnabled: true,
  autonomousCloserEnabled: false,
  fraudDetectionEnabled: true,
  reviewSystemEnabled: true,
  bnhubEnabled: true,
  realEstateEnabled: true,
};

function readFeatureJson(profile: {
  growthConfigJson: Prisma.JsonValue | null;
  fraudConfigJson: Prisma.JsonValue | null;
  trustConfigJson: Prisma.JsonValue | null;
  listingTypeSupportJson: Prisma.JsonValue | null;
}): Record<string, boolean> {
  const growthRoot = (profile.growthConfigJson as Record<string, unknown> | null) ?? {};
  const fraudRoot = (profile.fraudConfigJson as Record<string, unknown> | null) ?? {};
  const trustRoot = (profile.trustConfigJson as Record<string, unknown> | null) ?? {};
  const g = growthRoot.features as Record<string, boolean> | undefined;
  const f = fraudRoot.features as Record<string, boolean> | undefined;
  const t = trustRoot.features as Record<string, boolean> | undefined;
  const l = (profile.listingTypeSupportJson as Record<string, unknown> | null) ?? {};
  const fraudDirect: Partial<Record<CityFeatureKey, boolean>> = {};
  if (typeof fraudRoot.fraudDetectionEnabled === "boolean") {
    fraudDirect.fraudDetectionEnabled = fraudRoot.fraudDetectionEnabled;
  }
  const growthDirect: Partial<Record<CityFeatureKey, boolean>> = {};
  if (typeof growthRoot.messagingEnabled === "boolean") {
    growthDirect.messagingEnabled = growthRoot.messagingEnabled;
  }
  if (typeof growthRoot.autonomousCloserEnabled === "boolean") {
    growthDirect.autonomousCloserEnabled = growthRoot.autonomousCloserEnabled;
  }
  return {
    ...DEFAULT_FEATURES,
    bnhubEnabled: l.bnhub !== false,
    realEstateEnabled: l.real_estate !== false,
    ...(g ?? {}),
    ...(f ?? {}),
    ...(t ?? {}),
    ...fraudDirect,
    ...growthDirect,
  };
}

export async function getCityOperationProfile(cityKey: string) {
  const key = normalizeCityKey(cityKey);
  return prisma.cityOperationProfile.findUnique({ where: { cityKey: key } });
}

export async function isCityFeatureEnabled(cityKey: string, featureKey: CityFeatureKey): Promise<boolean> {
  const profile = await getCityOperationProfile(cityKey);
  if (!profile?.isActive) return DEFAULT_FEATURES[featureKey];
  const m = readFeatureJson(profile);
  return m[featureKey] ?? DEFAULT_FEATURES[featureKey];
}

export async function activateCity(cityKey: string): Promise<void> {
  const key = normalizeCityKey(cityKey);
  await prisma.cityOperationProfile.update({
    where: { cityKey: key },
    data: { isActive: true, launchStage: "active" },
  });
  await prisma.cityRolloutEvent.create({
    data: { cityKey: key, eventType: "activated", detailsJson: { at: new Date().toISOString() } },
  });
}

export async function pauseCity(cityKey: string): Promise<void> {
  const key = normalizeCityKey(cityKey);
  await prisma.cityOperationProfile.update({
    where: { cityKey: key },
    data: { isActive: false, launchStage: "paused" },
  });
  await prisma.cityRolloutEvent.create({
    data: { cityKey: key, eventType: "paused", detailsJson: { at: new Date().toISOString() } },
  });
}

export async function updateCityConfig(
  cityKey: string,
  patch: Partial<{
    cityName: string;
    provinceOrState: string | null;
    countryCode: string | null;
    launchStage: string;
    cityType: string | null;
    listingTypeSupportJson: Prisma.InputJsonValue;
    growthConfigJson: Prisma.InputJsonValue;
    rankingConfigKey: string | null;
    messagingConfigJson: Prisma.InputJsonValue;
    fraudConfigJson: Prisma.InputJsonValue;
    trustConfigJson: Prisma.InputJsonValue;
    launchNotes: string | null;
  }>
): Promise<void> {
  const key = normalizeCityKey(cityKey);
  await prisma.cityOperationProfile.update({
    where: { cityKey: key },
    data: patch,
  });
}

export async function ensureCityProfile(
  cityKey: string,
  cityName: string,
  opts?: Partial<{ provinceOrState: string; countryCode: string }>
): Promise<void> {
  const key = normalizeCityKey(cityKey);
  await prisma.cityOperationProfile.upsert({
    where: { cityKey: key },
    create: {
      cityKey: key,
      cityName,
      provinceOrState: opts?.provinceOrState ?? null,
      countryCode: opts?.countryCode ?? null,
      isActive: false,
      launchStage: "planned",
    },
    update: { cityName },
  });
}
