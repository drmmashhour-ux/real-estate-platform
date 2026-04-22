import { getPublicAppUrl } from "@/lib/config/public-app-url";

/** Default broker onboarding path for approved residence operators (locale/country prefix). */
export const DEFAULT_OPERATOR_ONBOARDING_PATH = "/en/ca/dashboard/broker/apply";

export function buildOperatorOnboardingUrl(path = DEFAULT_OPERATOR_ONBOARDING_PATH): string {
  const base = getPublicAppUrl().replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}
