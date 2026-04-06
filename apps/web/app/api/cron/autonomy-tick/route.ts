import { NextRequest } from "next/server";
import { runAutonomyTick } from "@/lib/ai/autonomy/autonomy-runner";

export const dynamic = "force-dynamic";

/**
 * POST /api/cron/autonomy-tick — bounded automation pass.
 * Authorization: Bearer $CRON_SECRET
 */
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!secret || token !== secret) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const out = await runAutonomyTick();
  return Response.json({ ok: true, ...out });
}
