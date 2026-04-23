import { NextRequest, NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";

import { getGuestId } from "@/lib/auth/session";
import { findDealForUser } from "@/lib/deals/deal-party-access";
import { prisma } from "@repo/db";
import type { DealIntelligenceEventType } from "@/modules/deal/deal.types";
import { recordDealIntelligenceEvent } from "@/modules/deal/deal.service";

export const dynamic = "force-dynamic";

const TYPES = new Set<DealIntelligenceEventType>(["VIEW", "VISIT", "OFFER", "MESSAGE"]);

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { id } = await context.params;
  const deal = await findDealForUser(id, userId, user.role as PlatformRole);
  if (!deal) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const o = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const type = typeof o.type === "string" ? (o.type as DealIntelligenceEventType) : null;
  const metadata =
    o.metadata != null && typeof o.metadata === "object" && !Array.isArray(o.metadata)
      ? (o.metadata as Record<string, unknown>)
      : undefined;

  if (!type || !TYPES.has(type)) {
    return NextResponse.json({ error: "type must be VIEW | VISIT | OFFER | MESSAGE" }, { status: 400 });
  }

  const result = await recordDealIntelligenceEvent(id, type, metadata);
  if (!result.ok) {
    return NextResponse.json({ error: "Unable to record event" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
