import { PlatformRole } from "@prisma/client";

import { getMobileAuthUser } from "@/modules/auth/mobile-auth";
import { buildGrowthBrainMobilePayload } from "@/modules/growth-brain/growth-brain.service";

export const dynamic = "force-dynamic";

/** GET `/api/mobile/admin/growth-brain/alerts` */
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
      alerts: payload.alerts.map((a) => ({
        id: a.id,
        kind: a.kind,
        title: a.title,
        body: a.body,
        severity: a.severity,
      })),
      topActions: payload.topActions.map((a) => ({
        id: a.id,
        actionType: a.actionType,
        target: a.target,
        approvalRequired: a.approvalRequired,
        riskLevel: a.riskLevel,
      })),
      allocationSlices: payload.allocation?.slices.slice(0, 5) ?? [],
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "alerts_failed";
    return Response.json({ error: msg }, { status: 500 });
  }
}
