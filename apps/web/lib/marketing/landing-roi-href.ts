import { marketingLandingFlags } from "@/config/feature-flags";

/**
 * ROI tool path for landing CTAs — locale-aware `Link` from `@/i18n/navigation` prepends `[locale]/[country]`.
 * When `FEATURE_LANDING_ROI_INTEGRATION_V1` is on, points at `/hosts/roi-calculator`; otherwise a generic host value page.
 */
export function getLandingRoiHref(): string {
  return marketingLandingFlags.landingRoiIntegrationV1 ? "/hosts/roi-calculator" : "/host/value";
}
