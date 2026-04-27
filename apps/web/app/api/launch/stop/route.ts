import { requireAdminSession } from "@/lib/admin/require-admin";
import { flags } from "@/lib/flags";
import { stopLaunch } from "@/lib/launch/controller";
import { getClientIp, rateLimit } from "@/lib/security/rateLimit";
import { logError } from "@/lib/monitoring/errorLogger";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const ip = getClientIp(req);
  if (!rateLimit(ip)) {
    return Response.json({ error: "Too many requests" }, { status: 429 });
  }

  if (!flags.AUTONOMOUS_AGENT) {
    return Response.json(
      { ok: false, message: "Launch control is disabled (set FEATURE_AI_AGENT=1)." },
      { status: 403 }
    );
  }

  const admin = await requireAdminSession();
  if (!admin.ok) {
    return Response.json({ ok: false, error: "Admin only" }, { status: admin.status });
  }

  try {
    const r = await stopLaunch();
    if (!r.ok) {
      return Response.json({ ok: false, error: r.error, code: r.code }, { status: 400 });
    }
    return Response.json({ ok: true });
  } catch (e) {
    logError(e, { route: "POST /api/launch/stop" });
    return Response.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
