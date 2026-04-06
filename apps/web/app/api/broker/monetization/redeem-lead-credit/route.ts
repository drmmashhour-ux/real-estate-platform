import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { redeemBrokerLeadWithCredit } from "@/modules/billing/brokerLeadBilling";
import { persistLaunchEvent } from "@/src/modules/launch/persistLaunchEvent";

export const dynamic = "force-dynamic";

/**
 * POST /api/broker/monetization/redeem-lead-credit
 * Body: { brokerLeadId }
 * Uses one `leadCreditsBalance` credit to mark the assigned lead paid (no Stripe).
 */
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? "anon";
  const limit = checkRateLimit(`broker:redeem-credit:${ip}`, { windowMs: 60_000, max: 30 });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: getRateLimitHeaders(limit) }
    );
  }

  const brokerId = await getGuestId();
  if (!brokerId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: brokerId },
    select: { role: true },
  });
  if (user?.role !== "BROKER" && user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Broker access required" }, { status: 403 });
  }

  let body: { brokerLeadId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const brokerLeadId = typeof body.brokerLeadId === "string" ? body.brokerLeadId.trim() : "";
  if (!brokerLeadId) {
    return NextResponse.json({ error: "brokerLeadId required" }, { status: 400 });
  }

  const result = await redeemBrokerLeadWithCredit(prisma, { brokerLeadId, brokerId });
  if (!result.ok) {
    const status = result.error === "insufficient_credits" ? 409 : 400;
    return NextResponse.json({ error: result.error }, { status, headers: getRateLimitHeaders(limit) });
  }

  void persistLaunchEvent("LEAD_PURCHASE_CREDIT", { brokerId, brokerLeadId });

  const profile = await prisma.brokerMonetizationProfile.findUnique({
    where: { brokerId },
    select: { leadCreditsBalance: true },
  });

  return NextResponse.json(
    { ok: true, leadCreditsBalance: profile?.leadCreditsBalance ?? 0 },
    { headers: getRateLimitHeaders(limit) }
  );
}
