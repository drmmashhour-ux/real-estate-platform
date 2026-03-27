import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { safeEvaluateDecision } from "@/modules/ai/decision-engine";
import type { AiHub } from "@/modules/ai/core/types";
import type { DecisionEntityType, ListingVariant } from "@/modules/ai/decision-engine/decision-types";

export const dynamic = "force-dynamic";

const HUBS = new Set<AiHub>(["buyer", "seller", "bnhub", "rent", "broker", "mortgage", "investor", "admin"]);

export async function POST(req: NextRequest) {
  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const rlKey = `ai-decision-engine:user:${userId}`;
  const rl = checkRateLimit(rlKey, { windowMs: 60 * 60 * 1000, max: 120 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many decision requests. Try again later." },
      { status: 429, headers: getRateLimitHeaders(rl) }
    );
  }

  let body: {
    hub?: string;
    entityType?: string;
    entityId?: string | null;
    listingVariant?: string;
    skipLog?: boolean;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const hub = body.hub as AiHub;
  if (!hub || !HUBS.has(hub)) {
    return NextResponse.json({ error: "Invalid hub" }, { status: 400 });
  }

  const entityType = (body.entityType ?? "platform") as DecisionEntityType;
  const allowedEntity: DecisionEntityType[] = [
    "listing",
    "booking",
    "lead",
    "deal",
    "invoice",
    "platform",
    "rental_listing",
    "rental_application",
    "rental_lease",
  ];
  if (!allowedEntity.includes(entityType)) {
    return NextResponse.json({ error: "Invalid entityType" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const listingVariant =
    body.listingVariant === "fsbo" || body.listingVariant === "crm" || body.listingVariant === "short_term"
      ? (body.listingVariant as ListingVariant)
      : undefined;

  const result = await safeEvaluateDecision({
    hub,
    userRole: user.role,
    userId,
    entityType,
    entityId: typeof body.entityId === "string" && body.entityId.length > 0 ? body.entityId : null,
    listingVariant: entityType === "listing" ? listingVariant : undefined,
    skipLog: Boolean(body.skipLog),
  });

  return NextResponse.json({ ok: true, result });
}
