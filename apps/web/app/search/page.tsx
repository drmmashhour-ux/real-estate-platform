import { redirect } from "next/navigation";
import { DEFAULT_COUNTRY_SLUG } from "@/config/countries";
import { routing } from "@/i18n/routing";

/** Short URL → locale search surface (marketplace + BNHUB search hub). */
export default function SearchShortUrl() {
  redirect(`/${routing.defaultLocale}/${DEFAULT_COUNTRY_SLUG}/search`);
}
