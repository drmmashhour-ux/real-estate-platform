import { RevenuePredictorDashboardClient } from "@/components/revenue-predictor/RevenuePredictorDashboardClient";

export const dynamic = "force-dynamic";

export default async function RevenuePredictorPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const adminBase = `/${locale}/${country}/dashboard/admin`;

  return <RevenuePredictorDashboardClient adminBase={adminBase} />;
}
