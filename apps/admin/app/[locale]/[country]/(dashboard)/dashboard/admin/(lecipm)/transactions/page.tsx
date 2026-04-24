import { AdminTransactionsLuxuryClient } from "@/components/dashboard/AdminTransactionsLuxuryClient";
import { getAdminTransactionsPageVm } from "@/modules/dashboard/services/admin-transactions.service";

export const dynamic = "force-dynamic";

export default async function AdminTransactionsPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const adminBase = `/${locale}/${country}/dashboard/admin`;
  const data = await getAdminTransactionsPageVm({ limit: 220, chartDays: 14 });

  return <AdminTransactionsLuxuryClient adminBase={adminBase} data={data} />;
}
