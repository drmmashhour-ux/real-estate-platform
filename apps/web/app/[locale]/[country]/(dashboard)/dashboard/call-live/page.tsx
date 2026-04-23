import { CallLiveDesktopClient } from "@/components/call-intelligence/CallLiveDesktopClient";
import { buildIntelPerformanceVm } from "@/modules/call-intelligence/call-intelligence-insights.service";
import { getAcquisitionDashboardVm } from "@/modules/acquisition/acquisition.service";
import { getConversionStats } from "@/modules/sales-scripts/sales-script-tracking.service";

export const dynamic = "force-dynamic";

export default async function CallLivePage() {
  const sinceDays = 90;
  const [dash, stats] = await Promise.all([
    getAcquisitionDashboardVm(),
    getConversionStats(sinceDays),
  ]);
  const performance = buildIntelPerformanceVm(stats, sinceDays);

  return <CallLiveDesktopClient contacts={dash.contacts} performance={performance} />;
}
