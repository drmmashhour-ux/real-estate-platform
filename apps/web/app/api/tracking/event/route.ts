import { NextRequest } from "next/server";
import { ingestClientTrackingEvent } from "@/lib/analytics/client-tracking-ingest";

export const dynamic = "force-dynamic";

/** POST /api/tracking/event — same ingestion as `/api/analytics/track` (LECIPM Growth System alias). */
export async function POST(req: NextRequest) {
  return ingestClientTrackingEvent(req, { rateLimitKeyPrefix: "tracking:event" });
}
