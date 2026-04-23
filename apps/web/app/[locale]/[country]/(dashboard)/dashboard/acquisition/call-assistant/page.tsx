import { CallAssistantLiveClient } from "@/components/call-assistant/CallAssistantLiveClient";
import { getAcquisitionDashboardVm } from "@/modules/acquisition/acquisition.service";
import { suggestWinningCategories } from "@/modules/sales-scripts/sales-script-tracking.service";

export const dynamic = "force-dynamic";

export default async function CallAssistantPage() {
  const [dash, hints] = await Promise.all([
    getAcquisitionDashboardVm(),
    suggestWinningCategories(5),
  ]);

  const winningHints = hints.slice(0, 3).map((h) => h.category.replace(/_/g, " "));

  return (
    <div className="mx-auto max-w-[1680px] space-y-6 p-6 text-white">
      <CallAssistantLiveClient contacts={dash.contacts} winningHints={winningHints} />
    </div>
  );
}
