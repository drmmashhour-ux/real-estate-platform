import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { getGuestId } from "@/lib/auth/session";
import { getDefaultTenantId } from "@/lib/buyer/tenant-context";
import { recordBuyerGrowthEvent } from "@/lib/buyer/buyer-analytics";

export const dynamic = "force-dynamic";

/** Placeholder payment: set NEXT_PUBLIC_BUYER_ADVISORY_PLACEHOLDER=1 to allow without Stripe. */
const PLACEHOLDER = process.env.NEXT_PUBLIC_BUYER_ADVISORY_PLACEHOLDER === "1";

export async function POST(request: NextRequest) {
  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required for premium advisory" }, { status: 401 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const plan = o.plan === "subscription" ? "subscription" : "one_time";
  const amountCents = plan === "one_time" ? 9900 : 4900;

  if (!PLACEHOLDER) {
    return NextResponse.json(
      {
        ok: false,
        error: "Payment integration pending",
        checkoutUrl: null,
        message: "Enable NEXT_PUBLIC_BUYER_ADVISORY_PLACEHOLDER=1 in development to simulate purchase.",
      },
      { status: 503 }
    );
  }

  const tenantId = await getDefaultTenantId();
  const expiresAt =
    plan === "subscription"
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

  const access = await prisma.advisoryAccess.create({
    data: {
      userId,
      tenantId,
      plan,
      amountCents,
      status: "active",
      buyerTier: "PREMIUM",
      expiresAt,
    },
  });

  void recordBuyerGrowthEvent("ADVISORY_PURCHASE", access.id, {
    plan,
    amountCents,
    userId,
  });

  await prisma.user.update({
    where: { id: userId },
    data: { plan: "pro" },
  }).catch(() => {});

  return NextResponse.json({
    ok: true,
    advisoryAccessId: access.id,
    buyerTier: "PREMIUM",
    expiresAt: expiresAt.toISOString(),
  });
}
