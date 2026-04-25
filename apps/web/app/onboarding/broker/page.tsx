import { redirect } from "next/navigation";
import { DEFAULT_COUNTRY_SLUG } from "@/config/countries";
import { routing } from "@/i18n/routing";

/** Short URL → localized broker onboarding (acquisition + LECIPM steps). */
export default function OnboardingBrokerRootPage() {
  redirect(`/${routing.defaultLocale}/${DEFAULT_COUNTRY_SLUG}/onboarding/broker`);
}
