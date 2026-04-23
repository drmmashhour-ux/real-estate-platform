import { redirect } from "next/navigation";

import { DEFAULT_COUNTRY_SLUG } from "@/config/countries";
import { routing } from "@/i18n/routing";

export default async function AdminAiSalesManagerUserShortcutPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  redirect(
    `/${routing.defaultLocale}/${DEFAULT_COUNTRY_SLUG}/dashboard/admin/ai-sales-manager/${encodeURIComponent(userId)}`,
  );
}
