import { AdminRevenueLuxuryClient } from "@/components/dashboard/AdminRevenueLuxuryClient";
import { getRevenueDashboardData } from "@/modules/dashboard/services/revenue-dashboard.service";

export const dynamic = "force-dynamic";

export default async function AdminRevenuePage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const adminBase = `/${locale}/${country}/dashboard/admin`;
  const data = await getRevenueDashboardData();

  return <AdminRevenueLuxuryClient adminBase={adminBase} data={data} />;
}
