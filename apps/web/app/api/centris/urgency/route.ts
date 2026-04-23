import { NextRequest } from "next/server";

import { gateDistributedRateLimit } from "@/lib/rate-limit-enforcement";
import { buildCentrisUrgencySignals } from "@/modules/centris-conversion/centris-urgency.service";

export const dynamic = "force-dynamic";

/** GET ?listingId= — public urgency copy for listing cards / conversion strip (rate limited). */
export async function GET(req: NextRequest) {
  const gate = await gateDistributedRateLimit(req, "public:centris:urgency", {
    windowMs: 60_000,
    max: 45,
  });
  if (!gate.allowed) return gate.response;

  const listingId = req.nextUrl.searchParams.get("listingId")?.trim();
  if (!listingId) return Response.json({ error: "listingId required" }, { status: 400 });

  const urgency = await buildCentrisUrgencySignals(listingId);

  return Response.json({ urgency });
}
