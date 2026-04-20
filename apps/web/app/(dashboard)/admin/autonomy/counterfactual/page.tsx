import { redirect } from "next/navigation";
import { DEFAULT_COUNTRY_SLUG } from "@/config/countries";
import { routing } from "@/i18n/routing";

/** Short URL → counterfactual / uplift admin dashboard. */
export default function AdminAutonomyCounterfactualShortcutPage() {
  redirect(`/${routing.defaultLocale}/${DEFAULT_COUNTRY_SLUG}/dashboard/admin/autonomy/counterfactual`);
}
