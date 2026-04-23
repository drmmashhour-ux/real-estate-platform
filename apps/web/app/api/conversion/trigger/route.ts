import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { getGuestId } from "@/lib/auth/session";
import { runFollowUpAutomation } from "@/modules/conversion-engine/application/followUpAutomationService";
import type { ConversionTrigger } from "@/modules/conversion-engine/domain/types";

export const dynamic = "force-dynamic";

const ALLOWED: ConversionTrigger[] = [
  "post_signup_welcome",
  "first_analysis_follow_up",
  "analysis_threshold",
  "high_value_view",
  "repeat_listing_interest",
  "inactive_reactivation",
];

export async function POST(req: Request) {
  const userId = await getGuestId().catch(() => null);
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const triggers = Array.isArray(body?.triggers)
    ? (body.triggers.filter((t: unknown): t is ConversionTrigger => typeof t === "string" && ALLOWED.includes(t as ConversionTrigger)) as ConversionTrigger[])
    : [];
  if (!triggers.length) return NextResponse.json({ error: "No valid triggers" }, { status: 400 });
  const listingId = typeof body?.listingId === "string" ? body.listingId : null;

  const queued = await runFollowUpAutomation(prisma, { userId, triggers, listingId });
  await prisma.trafficEvent
    .create({
      data: {
        eventType: "conversion_trigger",
        path: "/api/conversion/trigger",
        source: "conversion-engine",
        medium: "product",
        meta: { triggers, queued, listingId } as object,
      },
    })
    .catch(() => {});
  return NextResponse.json({ ok: true, queued });
}
