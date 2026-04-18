import { launchSystemV1Flags } from "@/config/feature-flags";
import { requireLaunchSystemPlatform } from "@/lib/launch-system-api-auth";
import { buildLaunchChecklist } from "@/modules/launch/launch-checklist.service";
import { logGrowthEngineAudit } from "@/modules/growth-engine-audit/growth-engine-audit.service";
import { trackLaunchStatusRead } from "@/lib/analytics/launch-analytics";

export const dynamic = "force-dynamic";

/** GET /api/launch/status — launch readiness checklist (DB + env; no fake green). */
export async function GET() {
  const auth = await requireLaunchSystemPlatform();
  if (!auth.ok) return auth.response;
  if (!launchSystemV1Flags.launchSystemV1) {
    return Response.json({ error: "FEATURE_LAUNCH_SYSTEM_V1 disabled" }, { status: 403 });
  }

  const payload = await buildLaunchChecklist();
  await logGrowthEngineAudit({
    actorUserId: auth.userId,
    action: "launch_status_read",
    payload: { status: payload.status },
  });
  trackLaunchStatusRead({ status: payload.status, issueCount: payload.issues.length });
  return Response.json({ ok: true, ...payload });
}
