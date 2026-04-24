import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getCapitalPipelineSummaryForUser } from "@/modules/capital/capital-monitoring.service";
import { capitalSummaryWhenRolloutDisabled, isLecipmPhaseEnabled, logRolloutGate } from "@/lib/lecipm/rollout";
import { withDomainProtection } from "@/lib/compliance/domain-protection";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  return withDomainProtection({
    domain: "FINANCIAL",
    action: "VIEW_ANALYTICS",
    handler: async (userId) => {
      if (!isLecipmPhaseEnabled(4)) {
        logRolloutGate(4, "/api/capital/pipeline/summary");
        return NextResponse.json(capitalSummaryWhenRolloutDisabled());
      }

      const summary = await getCapitalPipelineSummaryForUser(userId);
      return NextResponse.json(summary);
    }
  });
}
