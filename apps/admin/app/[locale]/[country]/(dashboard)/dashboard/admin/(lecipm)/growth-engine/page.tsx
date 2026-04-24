import { GrowthEngineAdminClient } from "@/components/growth-engine/GrowthEngineAdminClient";
import { getGrowthEngineDashboardPayload } from "@/modules/growth-engine";

export const dynamic = "force-dynamic";

export default async function AdminGrowthEnginePage() {
  const payload = await getGrowthEngineDashboardPayload();

  return <GrowthEngineAdminClient initial={payload} />;
}
