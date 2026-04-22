import { AdminMovementsLuxuryClient } from "@/components/dashboard/AdminMovementsLuxuryClient";
import { getMovementsDashboardData } from "@/modules/dashboard/services/movements-dashboard.service";

export const dynamic = "force-dynamic";

export default async function AdminPlatformMovementsPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const adminBase = `/${locale}/${country}/dashboard/admin`;
  const data = await getMovementsDashboardData({ limit: 48 });

  return <AdminMovementsLuxuryClient adminBase={adminBase} data={data} />;
}
