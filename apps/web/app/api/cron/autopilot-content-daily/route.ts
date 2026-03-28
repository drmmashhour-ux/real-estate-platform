import { NextRequest } from "next/server";
import { runDailyAutopilotContent } from "@/src/modules/ai/contentEngine";

export const dynamic = "force-dynamic";

/**
 * POST /api/cron/autopilot-content-daily — generate SEO + social + email, save and mark published.
 * Authorization: Bearer $CRON_SECRET
 */
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!secret || token !== secret) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const city = req.headers.get("x-autopilot-city")?.trim() || process.env.AUTOPILOT_DEFAULT_CITY?.trim();
  const result = await runDailyAutopilotContent({ city, publish: true });
  return Response.json({ ok: true, ...result });
}
