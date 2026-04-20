import { redirect } from "next/navigation";

import { DEFAULT_COUNTRY_SLUG } from "@/config/countries";
import { routing } from "@/i18n/routing";

export default function ComplianceDashboardShortcutPage() {
  redirect(`/${routing.defaultLocale}/${DEFAULT_COUNTRY_SLUG}/dashboard/compliance`);
}
