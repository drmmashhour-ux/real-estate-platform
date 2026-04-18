import { NextRequest } from "next/server";
import { ingestClientTrackingEvent } from "@/lib/analytics/client-tracking-ingest";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  return ingestClientTrackingEvent(req, { rateLimitKeyPrefix: "analytics:track" });
}
