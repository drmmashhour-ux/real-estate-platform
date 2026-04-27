import { redirect } from "next/navigation";

import { DEFAULT_COUNTRY_SLUG } from "@/config/countries";
import { routing } from "@/i18n/routing";

export default function ListingPricingEngineShortcutPage() {
  redirect(
    `/${routing.defaultLocale}/${DEFAULT_COUNTRY_SLUG}/dashboard/admin/market/listing-pricing`
  );
}
