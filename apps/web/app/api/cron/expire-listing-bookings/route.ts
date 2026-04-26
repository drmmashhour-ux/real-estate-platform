import { NextRequest } from "next/server";

import { expirePendingMarketplaceBookings } from "@/lib/marketplace/booking-hold";

export const dynamic = "force-dynamic";

/**
 * POST /api/cron/expire-listing-bookings — flip expired `pending` marketplace holds to `expired` (Order 57).
 * Authorization: Bearer $CRON_SECRET
 */
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!secret || token !== secret) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const r = await expirePendingMarketplaceBookings();
  return Response.json({ ok: true, count: r.count });
}
