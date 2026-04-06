import { NextRequest } from "next/server";
import { runBnhubMarketplaceDataLoop } from "@/lib/marketplace-engine/data-loop";

export const dynamic = "force-dynamic";

/**
 * Secured cron: refresh demand scores + keeps recommendation inputs warm.
 * Call from Vercel cron / GitHub Actions with header:
 *   Authorization: Bearer <BNHUB_MARKETPLACE_CRON_SECRET>
 */
export async function GET(request: NextRequest) {
  const secret = process.env.BNHUB_MARKETPLACE_CRON_SECRET?.trim();
  if (!secret) {
    return Response.json({ error: "Cron not configured" }, { status: 503 });
  }

  const auth = request.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (token !== secret) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runBnhubMarketplaceDataLoop();
  return Response.json({ ok: true, ...result });
}
