import { runSecurityMonitor } from "@/lib/security/security-monitor";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * POST /api/cron/security-monitor
 * Authorization: Bearer $CRON_SECRET
 *
 * Evaluates thresholds, may create SystemAlert rows and auto-block abusive IPs.
 */
export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = req.headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!secret || token !== secret) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const result = await runSecurityMonitor();
    return Response.json({ ok: true, ...result });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Monitor failed" }, { status: 500 });
  }
}
