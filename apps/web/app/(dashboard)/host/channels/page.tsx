import { redirect } from "next/navigation";
import { DEFAULT_COUNTRY_SLUG } from "@/config/countries";
import { routing } from "@/i18n/routing";

/**
 * Short path → canonical host channel manager hub under locale/country segments.
 */
export default function HostChannelsShortcutPage() {
  redirect(`/${routing.defaultLocale}/${DEFAULT_COUNTRY_SLUG}/host/channels`);
}
