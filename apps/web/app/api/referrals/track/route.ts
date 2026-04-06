import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";

const VALID_EVENTS = ["click", "invite_sent", "signup", "referral_signup", "activated", "paid"] as const;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const code = typeof body?.code === "string" ? body.code.trim().toUpperCase() : null;
    const eventType = typeof body?.eventType === "string" ? body.eventType.trim() : null;
    if (!code || !eventType || !VALID_EVENTS.includes(eventType as (typeof VALID_EVENTS)[number])) {
      return NextResponse.json({ error: "code and valid eventType required" }, { status: 400 });
    }
    const userId = (await getGuestId().catch(() => null)) ?? null;
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
    const userAgent = request.headers.get("user-agent");
    await prisma.referralEvent.create({
      data: { code, eventType, userId, ip, userAgent },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("POST /api/referrals/track:", e);
    return NextResponse.json({ ok: true, fallback: true });
  }
}
