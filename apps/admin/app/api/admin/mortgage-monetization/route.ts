import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const id = await getGuestId();
  if (!id) return { ok: false as const, status: 401, error: "Sign in required" };
  const u = await prisma.user.findUnique({ where: { id }, select: { role: true } });
  if (u?.role !== "ADMIN") return { ok: false as const, status: 403, error: "Admin only" };
  return { ok: true as const };
}

/** GET — mortgage expert monetization rollup (subscriptions, credits, commissions, payouts). */
export async function GET() {
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const [
    subInvoices,
    creditInvoices,
    commissionInvoices,
    dealsPlatformShare,
    payoutAgg,
    activeSubs,
  ] = await Promise.all([
    prisma.expertInvoice.aggregate({
      where: { type: "subscription" },
      _sum: { amountCents: true },
      _count: true,
    }),
    prisma.expertInvoice.aggregate({
      where: { type: "lead_credits" },
      _sum: { amountCents: true },
      _count: true,
    }),
    prisma.expertInvoice.aggregate({
      where: { type: "commission" },
      _sum: { amountCents: true },
      _count: true,
    }),
    prisma.mortgageDeal.aggregate({
      where: { status: { not: "void" } },
      _sum: { platformShare: true },
    }),
    prisma.expertPayoutRecord.groupBy({
      by: ["status"],
      _sum: { expertAmountCents: true, platformFeeCents: true },
    }),
    prisma.expertBilling.count({
      where: { status: { in: ["active", "trialing"] } },
    }),
  ]);

  const subscriptionCents = subInvoices._sum.amountCents ?? 0;
  const leadCreditsCents = creditInvoices._sum.amountCents ?? 0;
  const commissionInvoiceCents = commissionInvoices._sum.amountCents ?? 0;
  const dealCommissionDollars = dealsPlatformShare._sum.platformShare ?? 0;
  const dealCommissionCents = dealCommissionDollars * 100;

  const totalPlatformRevenueCents = subscriptionCents + leadCreditsCents + dealCommissionCents;

  return NextResponse.json({
    totals: {
      totalPlatformRevenueCents,
      subscriptionRevenueCents: subscriptionCents,
      leadCreditsRevenueCents: leadCreditsCents,
      /** Source of truth: sum of platform share on closed MortgageDeals (cents). */
      commissionRevenueCents: dealCommissionCents,
      commissionFromMortgageDealsDollars: dealCommissionDollars,
      /** Mirrors ExpertInvoice rows type=commission (audit). */
      commissionInvoicedCents: commissionInvoiceCents,
      activeStripeTrackedExperts: activeSubs,
    },
    invoiceCounts: {
      subscription: subInvoices._count,
      leadCredits: creditInvoices._count,
      commission: commissionInvoices._count,
    },
    payoutByStatus: payoutAgg,
  });
}
