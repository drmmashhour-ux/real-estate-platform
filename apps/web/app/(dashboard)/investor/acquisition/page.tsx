import { redirect } from "next/navigation";
import { DEFAULT_COUNTRY_SLUG } from "@/config/countries";
import { routing } from "@/i18n/routing";

/** Short URL → BNHub acquisition underwriting simulator (investor portal). */
export default function InvestorAcquisitionShortcutPage() {
  redirect(`/${routing.defaultLocale}/${DEFAULT_COUNTRY_SLUG}/investor/acquisition`);
}
