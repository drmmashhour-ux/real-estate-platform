import { NextResponse } from "next/server";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { requireMortgageExpertWithTerms } from "@/modules/mortgage/services/expert-guard";
import {
  mortgageBillingUtcMonthKey,
  mortgageMonthlyUsedAfterRollover,
  mortgageExpertMonthlyCap,
} from "@/modules/mortgage/services/billing-usage";

export const dynamic = "force-dynamic";

/** GET — billing snapshot for expert dashboard */
export async function GET() {
  const session = await requireMortgageExpertWithTerms();
  if ("error" in session) return session.error;
  const { expert } = session;

  const [billing, dealsAgg, invoices, payouts] = await Promise.all([
    prisma.expertBilling.findUnique({ where: { expertId: expert.id } }),
    prisma.mortgageDeal.aggregate({
      where: { expertId: expert.id, status: { not: "void" } },
      _sum: { expertShare: true, platformShare: true, dealAmount: true },
      _count: true,
    }),
    prisma.expertInvoice.findMany({
      where: { expertId: expert.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        type: true,
        amountCents: true,
        currency: true,
        description: true,
        createdAt: true,
      },
    }),
    prisma.expertPayoutRecord.groupBy({
      by: ["status"],
      where: { expertId: expert.id },
      _sum: { expertAmountCents: true },
    }),
  ]);

  const monthKey = mortgageBillingUtcMonthKey();
  const { used: leadsUsedThisMonth } = mortgageMonthlyUsedAfterRollover(billing, monthKey);
  const monthlyCap = mortgageExpertMonthlyCap(expert);

  const transferredCents =
    payouts.find((p) => p.status === "transferred")?._sum.expertAmountCents ?? 0;

  return NextResponse.json({
    plan: expert.expertSubscription?.plan ?? "basic",
    subscriptionActive: expert.expertSubscription?.isActive ?? false,
    stripeStatus: billing?.status ?? null,
    nextBillingDate: billing?.currentPeriodEnd?.toISOString() ?? null,
    leadsUsedThisMonth,
    monthlyLeadCap: monthlyCap,
    creditsRemaining: expert.expertCredits?.credits ?? null,
    /** Closed-deal expert share (whole dollars, same unit as MortgageDeal). */
    totalEarningsDollars: dealsAgg._sum.expertShare ?? 0,
    /** Platform commission paid on your closed deals (whole dollars). */
    totalCommissionsPaidDollars: dealsAgg._sum.platformShare ?? 0,
    dealsClosed: dealsAgg._count,
    payoutTransferredCents: transferredCents,
    recentInvoices: invoices,
  });
}
