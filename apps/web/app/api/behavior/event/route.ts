import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { BehaviorEventType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const SESSION_COOKIE = "lecipm_behavior_sid";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 400; // ~400 days

const ALLOWED = new Set(Object.values(BehaviorEventType));

/**
 * POST /api/behavior/event — append-only behavior signals for ranking learning.
 * Sets `lecipm_behavior_sid` cookie when absent (guest session continuity).
 */
export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventTypeRaw = body.eventType;
  if (typeof eventTypeRaw !== "string" || !ALLOWED.has(eventTypeRaw as BehaviorEventType)) {
    return NextResponse.json({ error: "Invalid or missing eventType" }, { status: 400 });
  }
  const eventType = eventTypeRaw as BehaviorEventType;

  const pageType = typeof body.pageType === "string" ? body.pageType.slice(0, 64) : "unknown";
  let sessionId = request.cookies.get(SESSION_COOKIE)?.value?.trim();
  if (!sessionId || sessionId.length < 8) {
    sessionId = randomUUID();
  }

  const userId = (await getGuestId()) ?? null;
  const listingId = typeof body.listingId === "string" ? body.listingId : null;
  const city = typeof body.city === "string" ? body.city.slice(0, 128) : null;
  const category = typeof body.category === "string" ? body.category.slice(0, 64) : null;
  const propertyType = typeof body.propertyType === "string" ? body.propertyType.slice(0, 64) : null;
  const priceCents = typeof body.priceCents === "number" && Number.isFinite(body.priceCents) ? Math.round(body.priceCents) : null;
  const aiScoreSnapshot =
    typeof body.aiScoreSnapshot === "number" && Number.isFinite(body.aiScoreSnapshot) ? body.aiScoreSnapshot : null;
  const metadataJson =
    body.metadata && typeof body.metadata === "object" ? (body.metadata as object) : undefined;

  try {
    await prisma.userBehaviorEvent.create({
      data: {
        sessionId,
        userId: userId ?? undefined,
        listingId: listingId ?? undefined,
        eventType,
        pageType,
        city: city ?? undefined,
        category: category ?? undefined,
        propertyType: propertyType ?? undefined,
        priceCents: priceCents ?? undefined,
        aiScoreSnapshot: aiScoreSnapshot ?? undefined,
        metadataJson,
      },
    });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  const res = NextResponse.json({ ok: true, sessionId });
  res.cookies.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
  return res;
}
