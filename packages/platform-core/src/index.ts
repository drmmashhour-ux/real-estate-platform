export type {
  PlatformRegionCode,
  PlatformRegionGroup,
  PlatformRegionAppTarget,
  RegionCapabilities,
  RegionDefinition,
  RegionContext,
} from "./regions/region.types";

export {
  REGION_REGISTRY,
  DEFAULT_PLATFORM_REGION_CODE,
  getRegionDefinition,
  getRegionsByAppTarget,
  listWebHostedRegions,
  isRegionCapabilityEnabled,
  type RegionCapabilityKey,
} from "./regions/region-registry";

export {
  resolveRegionFromHost,
  resolveRegionFromPath,
  resolveRegionFromCountryLocale,
  getDefaultAppTargetForRegion,
  type ResolveRegionFromCountryLocaleParams,
} from "./regions/region-resolution.service";

export type {
  NormalizedListing,
  NormalizedBooking,
  NormalizedUserProfile,
  NormalizedPayout,
  NormalizedRiskFlag,
  NormalizedTrustProfile,
  NormalizedAppSource,
  NormalizedComplianceState,
} from "./domain/normalized-listing.types";

export type {
  ListingNormalizer,
  ListingNormalizerResult,
  BookingNormalizer,
  UserNormalizer,
  RegionDataAdapter,
} from "./domain/normalizer-contracts";

export type { JurisdictionPolicyPack } from "./legal/jurisdiction-policy-pack.types";

export type { GlobalMultiRegionFeatureFlags } from "./flags/platform-flags.types";
