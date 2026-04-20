import { redirect } from "next/navigation";
import { DEFAULT_COUNTRY_SLUG } from "@/config/countries";
import { routing } from "@/i18n/routing";

/** Short URL → contextual bandit admin dashboard. */
export default function AdminAutonomyContextualShortcutPage() {
  redirect(`/${routing.defaultLocale}/${DEFAULT_COUNTRY_SLUG}/dashboard/admin/autonomy/contextual`);
}
