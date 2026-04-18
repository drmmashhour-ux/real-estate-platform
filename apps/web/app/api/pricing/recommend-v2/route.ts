import { NextResponse } from "next/server";
import { z } from "zod";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { revenueV4Flags } from "@/config/feature-flags";
import { recommendPriceV2 } from "@/src/modules/pricing/pricing-v2.engine";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { headers } from "next/headers";
import { logHostFunnelEvent } from "@/lib/host-funnel/logger";

export const dynamic = "force-dynamic";

const BodyZ = z.object({
  listingType: z.enum(["fsbo", "bnhub"]),
  listingId: z.string().min(8).max(64),
  persistSnapshot: z.boolean().optional(),
  leadId: z.string().optional(),
});

/** POST /api/pricing/recommend-v2 — owner-authenticated; recommendation-only. */
export async function POST(req: Request) {
  if (!revenueV4Flags.pricingEngineV2) {
    return NextResponse.json({ ok: false, error: "Feature disabled" }, { status: 403 });
  }

  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Sign in required" }, { status: 401 });
  }

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rl = checkRateLimit(`pricing:v2:${ip}`, { windowMs: 60_000, max: 60 });
  if (!rl.allowed) {
    return NextResponse.json({ ok: false, error: "Too many requests" }, { status: 429, headers: getRateLimitHeaders(rl) });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = BodyZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }

  const { listingType, listingId, persistSnapshot, leadId } = parsed.data;

  if (listingType === "fsbo") {
    const row = await prisma.fsboListing.findFirst({
      where: { id: listingId, ownerId: userId },
      select: { id: true },
    });
    if (!row) {
      return NextResponse.json({ ok: false, error: "Listing not found" }, { status: 404 });
    }
  } else {
    const row = await prisma.shortTermListing.findFirst({
      where: { id: listingId, ownerId: userId },
      select: { id: true },
    });
    if (!row) {
      return NextResponse.json({ ok: false, error: "Listing not found" }, { status: 404 });
    }
  }

  try {
    const result = await recommendPriceV2(
      { listingType, listingId },
      { persistSnapshot: Boolean(persistSnapshot), leadId: leadId ?? null },
    );
    if (!result) {
      return NextResponse.json({ ok: false, error: "Engine unavailable" }, { status: 503 });
    }
    logHostFunnelEvent("pricing_insight_viewed", { listingType, listingId: listingId.slice(0, 8) });
    return NextResponse.json({ ok: true, result });
  } catch (e) {
    console.error("recommend-v2", e);
    return NextResponse.json({ ok: false, error: "Could not compute recommendation" }, { status: 500 });
  }
}
