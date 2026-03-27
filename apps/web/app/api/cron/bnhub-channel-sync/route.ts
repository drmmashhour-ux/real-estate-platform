import { NextRequest } from "next/server";
import { syncAllConnections } from "@/src/modules/bnhub-channel-manager";

export const dynamic = "force-dynamic";

/**
 * POST /api/cron/bnhub-channel-sync — iCal import for due connections (~15–30 min cadence).
 * Authorization: Bearer $CRON_SECRET
 */
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!secret || token !== secret) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { processed, errors } = await syncAllConnections();
  return Response.json({ ok: true, processed, errors });
}
