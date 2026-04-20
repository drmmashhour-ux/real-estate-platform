import { redirect } from "next/navigation";
import { DEFAULT_COUNTRY_SLUG } from "@/config/countries";
import { routing } from "@/i18n/routing";

/** Short URL → BNHub self-learning autonomy dashboard. */
export default function AdminAutonomyLearningShortcutPage() {
  redirect(`/${routing.defaultLocale}/${DEFAULT_COUNTRY_SLUG}/dashboard/admin/autonomy/learning`);
}
