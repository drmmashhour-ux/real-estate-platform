import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getGuestId } from "@/lib/auth/session";
import { trackRevenueEvent } from "@/modules/revenue/revenue-events.service";
import type { RevenueEventType } from "@/modules/revenue/revenue-events.types";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  type: z.enum([
    "lead_unlocked",
    "lead_viewed",
    "contact_revealed",
    "booking_started",
    "booking_completed",
    "premium_insight_viewed",
  ]),
  listingId: z.string().optional().nullable(),
  leadId: z.string().optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Client-safe revenue event fan-in (CTA clicks, impressions). Authenticated users only.
 */
export async function POST(req: NextRequest) {
  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }

  const { type, listingId, leadId, metadata } = parsed.data;
  trackRevenueEvent({
    type: type as RevenueEventType,
    userId,
    listingId: listingId ?? undefined,
    leadId: leadId ?? undefined,
    metadata: {
      ...metadata,
      source: typeof metadata?.source === "string" ? metadata.source : "client",
    },
  });

  return NextResponse.json({ ok: true });
}
