import { requireAdminSession } from "@/lib/admin/require-admin";
import { flags } from "@/lib/flags";
import { getLaunchStatus } from "@/lib/launch/controller";
import { getClientIp, rateLimit } from "@/lib/security/rateLimit";
import { logError } from "@/lib/monitoring/errorLogger";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const ip = getClientIp(req);
  if (!rateLimit(ip)) {
    return Response.json({ error: "Too many requests" }, { status: 429 });
  }

  if (!flags.AUTONOMOUS_AGENT) {
    return Response.json(
      { message: "Launch control is disabled.", status: null, startedAt: null, currentDay: null },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  }

  const admin = await requireAdminSession();
  if (!admin.ok) {
    return Response.json({ error: "Admin only" }, { status: admin.status });
  }

  try {
    const s = await getLaunchStatus();
    return Response.json(
      {
        status: s.status,
        startedAt: s.startedAt?.toISOString() ?? null,
        currentDay: s.currentDay,
      },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    logError(e, { route: "GET /api/launch/status" });
    return Response.json({ error: "Failed" }, { status: 500 });
  }
}
