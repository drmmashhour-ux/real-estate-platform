import { NextRequest, NextResponse } from "next/server";
import { ingestExternalReservationWebhook } from "@/lib/bnhub/channel-integration";

export const dynamic = "force-dynamic";

/**
 * Inbound webhooks from channel managers / OTAs (Booking.com, Airbnb, Expedia, etc.)
 * Secured optionally via INTEGRATIONS_WEBHOOK_SECRET — set in production.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.INTEGRATIONS_WEBHOOK_SECRET?.trim();
  if (secret) {
    const hdr = req.headers.get("x-webhook-secret") ?? req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    if (hdr !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = await ingestExternalReservationWebhook(body);
  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: result.status });
  }
  return NextResponse.json({ ok: true });
}
