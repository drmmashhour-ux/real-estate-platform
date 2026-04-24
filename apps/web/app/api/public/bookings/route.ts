import { NextRequest, NextResponse } from "next/server";
import { recordPublicApiUsage } from "@/lib/platform/api-usage";
import { authenticatePublicApi } from "@/lib/platform/public-api-auth";
import { WEBHOOK_EVENTS, dispatchPartnerWebhook } from "@/modules/platform/webhooks";

/**
 * Stub booking intake for partner automation — replace with real booking service.
 */
export async function POST(req: NextRequest) {
  const auth = authenticatePublicApi(req, ["bookings:write"]);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  recordPublicApiUsage(auth.partner.id, "/api/public/bookings", "POST");
  let raw: Record<string, unknown> = {};
  try {
    raw = (await req.json()) as Record<string, unknown>;
  } catch {
    raw = {};
  }
  const booking = {
    id: `bkg_${globalThis.crypto?.randomUUID?.() ?? String(Date.now())}`,
    partnerId: auth.partner.id,
    createdAt: new Date().toISOString(),
    ...raw,
  };
  await dispatchPartnerWebhook(auth.partner, WEBHOOK_EVENTS.BOOKING_CREATED, { booking });
  return NextResponse.json({ data: booking }, { status: 201 });
}
