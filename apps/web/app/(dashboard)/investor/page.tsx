import InvestorPitchDashboardClient from "@/components/investor/InvestorPitchDashboardClient";
import { canViewLiveInvestorPitchDashboard } from "@/modules/investor/investor-pitch-access";
import { getInvestorPitchDashboardVm } from "@/modules/investor/investor-pitch-data.service";

export default async function InvestorPitchPage(props: {
  searchParams?: Promise<{ demo?: string; sample?: string }>;
}) {
  const searchParams = (await props.searchParams) ?? {};
  const demoPresentationMode = searchParams.demo === "1";
  const sampleOverride = searchParams.sample === "1";

  const allowLive = await canViewLiveInvestorPitchDashboard();
  const sampleMode = demoPresentationMode || sampleOverride || !allowLive;

  const vm = await getInvestorPitchDashboardVm({ sampleMode });

  return (
    <InvestorPitchDashboardClient
      initialVm={vm}
      allowLiveMetrics={allowLive}
      demoPresentationMode={demoPresentationMode}
    />
  );
}
