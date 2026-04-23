import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { captureServerEvent } from "@/lib/analytics/posthog-server";

const ALLOWED = new Set(["viewed", "saved", "ignored", "analyzed", "contacted", "clicked", "dismissed"]);

export async function POST(req: Request) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const listingId = typeof body?.listingId === "string" ? body.listingId : "";
  const interactionType = typeof body?.interactionType === "string" ? body.interactionType : "";

  if (!listingId || !ALLOWED.has(interactionType)) {
    return NextResponse.json({ error: "Invalid interaction payload" }, { status: 400 });
  }

  await prisma.feedInteraction.create({
    data: { userId, listingId, interactionType },
  });

  captureServerEvent(userId, `daily_deal_${interactionType}`, { listingId });

  return NextResponse.json({ ok: true });
}
