import { AiSalesManagerDashboardClient } from "@/components/ai-sales-manager/AiSalesManagerDashboardClient";

export const dynamic = "force-dynamic";

export default async function AiSalesManagerPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const adminBase = `/${locale}/${country}/dashboard/admin`;

  return <AiSalesManagerDashboardClient adminBase={adminBase} />;
}
