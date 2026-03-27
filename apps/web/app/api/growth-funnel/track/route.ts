import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { isFunnelEventName } from "@/src/modules/growth-funnel/domain/funnelEvents";
import { trackGrowthFunnelEvent } from "@/src/modules/growth-funnel/application/trackGrowthFunnelEvent";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const userId = await getGuestId();
  const body = await req.json().catch(() => ({}));
  const eventName = typeof body.eventName === "string" ? body.eventName : "";
  const properties = typeof body.properties === "object" && body.properties !== null ? body.properties : {};

  if (!isFunnelEventName(eventName)) {
    return NextResponse.json({ error: "Invalid eventName" }, { status: 400 });
  }

  await trackGrowthFunnelEvent({
    userId,
    eventName,
    properties: properties as Record<string, unknown>,
  });

  return NextResponse.json({ ok: true });
}
