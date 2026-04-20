import { redirect } from "next/navigation";
import { DEFAULT_COUNTRY_SLUG } from "@/config/countries";
import { routing } from "@/i18n/routing";

/**
 * Legacy/short path: real host calendar lives under `/{locale}/{country}/host/calendar`
 * (i18n + market segment). Redirect to default locale/country.
 */
export default function HostCalendarShortcutPage() {
  redirect(`/${routing.defaultLocale}/${DEFAULT_COUNTRY_SLUG}/host/calendar`);
}
