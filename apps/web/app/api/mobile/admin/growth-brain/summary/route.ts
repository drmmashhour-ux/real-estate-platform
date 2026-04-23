import { PlatformRole } from "@prisma/client";

import { getMobileAuthUser } from "@/modules/auth/mobile-auth";
import { buildGrowthBrainMobilePayload } from "@/modules/growth-brain/growth-brain.service";

export const dynamic = "force-dynamic";

/** GET `/api/mobile/admin/growth-brain/summary` — compact bundle for mobile admin */
export async function GET() {
  const auth = await getMobileAuthUser(request);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (auth.role !== PlatformRole.ADMIN) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const payload = buildGrowthBrainMobilePayload();
    return Response.json({
      generatedAt: payload.generatedAtIso,
      autonomy: payload.autonomy,
      opportunityCount: payload.opportunities.length,
      topOpportunityTitle: payload.opportunities[0]?.title ?? null,
      allocationHeadline: payload.allocation?.headline ?? null,
      alertCount: payload.alerts.length,
      pendingApprovalsApprox: payload.topActions.filter((a) => a.approvalRequired).length,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "summary_failed";
    return Response.json({ error: msg }, { status: 500 });
  }
}
