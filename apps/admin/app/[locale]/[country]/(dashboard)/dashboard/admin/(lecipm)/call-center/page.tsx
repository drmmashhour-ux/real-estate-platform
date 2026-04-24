import { CallCenterAdminClient } from "@/components/call-center/CallCenterAdminClient";
import { buildCallPerformanceVm } from "@/modules/call-center/call-performance.service";
import { getConversionStats } from "@/modules/sales-scripts/sales-script-tracking.service";

export const dynamic = "force-dynamic";

export default async function AdminCallCenterPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const dashBase = `/${locale}/${country}/dashboard`;

  const sinceDays = 90;
  const stats = await getConversionStats(sinceDays);
  const performance = buildCallPerformanceVm(stats, sinceDays);

  return <CallCenterAdminClient dashBase={dashBase} performance={performance} />;
}
