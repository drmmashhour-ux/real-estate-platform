import { AdminHubDetailLuxuryClient } from "@/components/dashboard/AdminHubDetailLuxuryClient";

import type { AdminHubSlug } from "@/components/dashboard/AdminHubDetailLuxuryClient";

export async function HubAdminDetailPage({
  params,
  hub,
  hubTitle,
}: {
  params: Promise<{ locale: string; country: string }>;
  hub: AdminHubSlug;
  hubTitle: string;
}) {
  const { locale, country } = await params;
  const adminBase = `/${locale}/${country}/dashboard/admin`;

  return <AdminHubDetailLuxuryClient hub={hub} hubTitle={hubTitle} adminBase={adminBase} />;
}
