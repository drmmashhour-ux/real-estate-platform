import { NextRequest } from "next/server";
import { prisma } from "@repo/db";
import { getFinanceActor } from "@/lib/admin/finance-request";
import { logFinancialAction } from "@/lib/admin/financial-audit";

export const dynamic = "force-dynamic";

/** GET /api/admin/finance/overview — revenue, commissions, refunds (ADMIN + ACCOUNTANT) */
export async function GET(request: NextRequest) {
  const actor = await getFinanceActor();
  if (!actor) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const dateFrom = searchParams.get("dateFrom") ? new Date(searchParams.get("dateFrom")!) : null;
  const dateTo = searchParams.get("dateTo") ? new Date(searchParams.get("dateTo")!) : null;
  if (dateTo) dateTo.setHours(23, 59, 59, 999);

  const paymentWhere = {
    status: "paid",
    ...(dateFrom || dateTo
      ? {
          createdAt: {
            ...(dateFrom ? { gte: dateFrom } : {}),
            ...(dateTo ? { lte: dateTo } : {}),
          },
        }
      : {}),
  };

  const failedWhere = {
    status: "failed" as const,
    ...(dateFrom || dateTo
      ? {
          createdAt: {
            ...(dateFrom ? { gte: dateFrom } : {}),
            ...(dateTo ? { lte: dateTo } : {}),
          },
        }
      : {}),
  };

  const ledgerDateFilter =
    dateFrom || dateTo
      ? {
          platformPayment: {
            status: "paid",
            createdAt: {
              ...(dateFrom ? { gte: dateFrom } : {}),
              ...(dateTo ? { lte: dateTo } : {}),
            },
          },
        }
      : { platformPayment: { status: "paid" as const } };

  const [payments, failedCount, refundAgg, commissions, byType, ledgerByParty] = await Promise.all([
    prisma.platformPayment.findMany({ where: paymentWhere, select: { amountCents: true, paymentType: true, stripeFeeCents: true, refundedAmountCents: true, createdAt: true } }),
    prisma.platformPayment.count({ where: failedWhere }).catch(() => 0),
    prisma.platformPayment.aggregate({
      where: paymentWhere,
      _sum: { refundedAmountCents: true },
    }),
    prisma.brokerCommission.findMany({
      where: dateFrom || dateTo ? { createdAt: { ...(dateFrom ? { gte: dateFrom } : {}), ...(dateTo ? { lte: dateTo } : {}) } } : {},
      select: { brokerAmountCents: true, platformAmountCents: true },
    }),
    prisma.platformPayment.groupBy({
      by: ["paymentType"],
      where: paymentWhere,
      _sum: { amountCents: true },
    }),
    prisma.partyRevenueLedgerEntry
      .groupBy({
        by: ["party"],
        where: ledgerDateFilter,
        _sum: { amountCents: true },
      })
      .catch(() => [] as { party: "PLATFORM" | "BROKER"; _sum: { amountCents: number | null } }[]),
  ]);

  const totalRevenueCents = payments.reduce((s, p) => s + p.amountCents, 0);
  const totalFeesCents = payments.reduce((s, p) => s + (p.stripeFeeCents ?? 0), 0);
  const brokerPayoutCents = commissions.reduce((s, c) => s + c.brokerAmountCents, 0);
  const platformCommissionCents = commissions.reduce((s, c) => s + c.platformAmountCents, 0);
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthlyPayments = payments.filter((p) => new Date(p.createdAt) >= monthStart);
  const monthlyRevenueCents = monthlyPayments.reduce((s, p) => s + p.amountCents, 0);

  const revenueBySource = {
    bnhub_rentals: byType.find((g) => g.paymentType === "booking")?._sum.amountCents ?? 0,
    property_sales: (byType.find((g) => g.paymentType === "deposit")?._sum.amountCents ?? 0) + (byType.find((g) => g.paymentType === "closing_fee")?._sum.amountCents ?? 0),
    subscriptions: byType.find((g) => g.paymentType === "subscription")?._sum.amountCents ?? 0,
    lead_unlock:
      (byType.find((g) => g.paymentType === "lead_unlock")?._sum.amountCents ?? 0) +
      (byType.find((g) => g.paymentType === "mortgage_contact_unlock")?._sum.amountCents ?? 0),
    other: byType
      .filter(
        (g) =>
          !["booking", "deposit", "closing_fee", "subscription", "lead_unlock", "mortgage_contact_unlock"].includes(
            g.paymentType
          )
      )
      .reduce((s, g) => s + (g._sum.amountCents ?? 0), 0),
  };

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  await logFinancialAction({
    actorUserId: actor.user.id,
    action: "finance_overview_view",
    ipAddress: ip,
    metadata: { dateFrom: dateFrom?.toISOString(), dateTo: dateTo?.toISOString() },
  });

  const ledgerPlatformCents = ledgerByParty.find((g) => g.party === "PLATFORM")?._sum.amountCents ?? 0;
  const ledgerBrokerCents = ledgerByParty.find((g) => g.party === "BROKER")?._sum.amountCents ?? 0;

  return Response.json({
    totalRevenueCents,
    monthlyRevenueCents,
    revenueBySource,
    revenueLedger: {
      platformCents: ledgerPlatformCents,
      brokerCents: ledgerBrokerCents,
      note: "Separate ledger rows per party (not mixed). Populated from new payments after migration.",
    },
    stripeFeesCents: totalFeesCents,
    refundsCents: refundAgg._sum.refundedAmountCents ?? 0,
    failedPaymentsCount: failedCount,
    brokerPayoutCents,
    platformProfitFromCommissionsCents: platformCommissionCents,
    paymentCount: payments.length,
    disclaimer:
      "Financial figures are platform-internal. Tax treatment (GST/QST, income) must be validated by a licensed accountant for your jurisdiction.",
  });
}
