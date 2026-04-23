import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuestId, getUserRole } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { isFinancialStaff } from "@/lib/admin/finance-access";
import { HubLayout } from "@/components/hub/HubLayout";
import { hubNavigation } from "@/lib/hub/navigation";
import { FinanceHubTabs } from "@/components/admin/FinanceHubTabs";
import { FinanceActionButton } from "@/components/admin/FinanceActionButton";
import { getBnhubCommissionRate } from "@/lib/stripe/bnhub-connect";
import { BNHUB_PLATFORM_COMMISSION_LABEL, FSBO_BASIC_FEE_LABEL } from "@/lib/revenue/money-flow";

export const dynamic = "force-dynamic";

type SearchParams = {
  dateFrom?: string;
  dateTo?: string;
};

export default async function AdminFinancePage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login");
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true, email: true } });
  if (!isFinancialStaff(user?.role)) redirect("/");
  const navRole = await getUserRole();

  const params = (await searchParams) ?? {};
  const dateFrom = params.dateFrom ? new Date(params.dateFrom) : null;
  const dateTo = params.dateTo ? new Date(params.dateTo) : null;
  if (dateTo) dateTo.setHours(23, 59, 59, 999);

  const paymentWhere = {
    status: "paid" as const,
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

  const pendingPayWhere = {
    status: "pending" as const,
    ...(dateFrom || dateTo
      ? {
          createdAt: {
            ...(dateFrom ? { gte: dateFrom } : {}),
            ...(dateTo ? { lte: dateTo } : {}),
          },
        }
      : {}),
  };

  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const paidYearWhere = { status: "paid" as const, createdAt: { gte: yearStart } };

  const bnhubPaymentWhere = {
    status: "COMPLETED" as const,
    ...(dateFrom || dateTo
      ? {
          updatedAt: {
            ...(dateFrom ? { gte: dateFrom } : {}),
            ...(dateTo ? { lte: dateTo } : {}),
          },
        }
      : {}),
  };

  const stripeLedgerWhere =
    dateFrom || dateTo
      ? {
          createdAt: {
            ...(dateFrom ? { gte: dateFrom } : {}),
            ...(dateTo ? { lte: dateTo } : {}),
          },
        }
      : {};

  const [
    payments,
    failedCount,
    refundSum,
    commissions,
    ledgerRecent,
    paidCount,
    pendingPayCount,
    refundedPaymentCount,
    yearPaidAgg,
    pendingCommissions,
    paidCommissions,
    bnhubBookingVolume,
    bnhubHostsPayoutBlocked,
    bnhubRecentPayments,
    bnhubCompletedBookingsCount,
    fsboPlatformPaymentAgg,
    unifiedBnFsboRows,
    pendingPlatformPaymentsRows,
    failedPlatformPaymentsRows,
    pendingBrokerCommissionRows,
    payoutHoldRows,
    stripeLedgerWindow,
    brokerPayoutBatches,
  ] = await Promise.all([
    prisma.platformPayment.findMany({
      where: paymentWhere,
      select: { amountCents: true, paymentType: true, stripeFeeCents: true, createdAt: true },
    }),
    prisma.platformPayment.count({ where: failedWhere }),
    prisma.platformPayment.aggregate({
      where: paymentWhere,
      _sum: { refundedAmountCents: true },
    }),
    prisma.brokerCommission.findMany({
      where:
        dateFrom || dateTo
          ? {
              createdAt: {
                ...(dateFrom ? { gte: dateFrom } : {}),
                ...(dateTo ? { lte: dateTo } : {}),
              },
            }
          : {},
      select: { brokerAmountCents: true, platformAmountCents: true, status: true },
    }),
    prisma.stripeLedgerEntry.findMany({
      orderBy: { createdAt: "desc" },
      take: 15,
      select: {
        id: true,
        objectType: true,
        stripeObjectId: true,
        amountCents: true,
        feeCents: true,
        currency: true,
        status: true,
        platformPaymentId: true,
        createdAt: true,
      },
    }),
    prisma.platformPayment.count({ where: { ...paymentWhere } }),
    prisma.platformPayment.count({ where: pendingPayWhere }),
    prisma.platformPayment.count({
      where: {
        ...paymentWhere,
        refundedAmountCents: { gt: 0 },
      },
    }),
    prisma.platformPayment.aggregate({
      where: paidYearWhere,
      _sum: { amountCents: true, stripeFeeCents: true, refundedAmountCents: true },
    }),
    prisma.brokerCommission.aggregate({
      where: { status: "pending" },
      _sum: { brokerAmountCents: true },
    }),
    prisma.brokerCommission.aggregate({
      where: { status: "paid" },
      _sum: { brokerAmountCents: true },
    }),
    prisma.payment.aggregate({
      where: bnhubPaymentWhere,
      _sum: { amountCents: true, platformFeeCents: true, hostPayoutCents: true },
    }),
    prisma.user.count({
      where: {
        shortTermListings: { some: {} },
        OR: [{ stripeAccountId: null }, { stripeOnboardingComplete: false }],
      },
    }),
    prisma.payment.findMany({
      where: bnhubPaymentWhere,
      orderBy: { updatedAt: "desc" },
      take: 20,
      select: {
        amountCents: true,
        platformFeeCents: true,
        hostPayoutCents: true,
        status: true,
        stripeConnectAccountId: true,
        updatedAt: true,
        booking: {
          select: {
            id: true,
            confirmationCode: true,
            bookingSource: true,
            listing: { select: { title: true } },
            guest: { select: { email: true } },
          },
        },
      },
    }),
    prisma.payment.count({ where: bnhubPaymentWhere }),
    prisma.platformPayment.aggregate({
      where: { ...paymentWhere, paymentType: "fsbo_publish" },
      _sum: { amountCents: true, platformFeeCents: true, hostPayoutCents: true },
    }),
    prisma.platformPayment.findMany({
      where: {
        status: "paid",
        paymentType: { in: ["booking", "fsbo_publish"] },
        ...(dateFrom || dateTo
          ? {
              createdAt: {
                ...(dateFrom ? { gte: dateFrom } : {}),
                ...(dateTo ? { lte: dateTo } : {}),
              },
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 45,
      select: {
        id: true,
        paymentType: true,
        amountCents: true,
        platformFeeCents: true,
        hostPayoutCents: true,
        status: true,
        stripeSessionId: true,
        bookingId: true,
        fsboListingId: true,
        createdAt: true,
        fsboListing: { select: { id: true, title: true } },
        linkedContractId: true,
        linkedContractType: true,
        userId: true,
      },
    }),
    prisma.platformPayment.findMany({
      where: pendingPayWhere,
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        paymentType: true,
        amountCents: true,
        createdAt: true,
        fsboListingId: true,
        dealId: true,
        bookingId: true,
        fsboListing: { select: { id: true, title: true } },
      },
    }),
    prisma.platformPayment.findMany({
      where: failedWhere,
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        paymentType: true,
        amountCents: true,
        createdAt: true,
        fsboListingId: true,
        dealId: true,
        bookingId: true,
        fsboListing: { select: { id: true, title: true } },
      },
    }),
    prisma.brokerCommission.findMany({
      where: { status: "pending" },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        brokerId: true,
        brokerAmountCents: true,
        platformAmountCents: true,
        createdAt: true,
        payment: {
          select: {
            id: true,
            dealId: true,
            fsboListingId: true,
            paymentType: true,
            fsboListing: { select: { id: true, title: true } },
          },
        },
      },
    }),
    prisma.payment.findMany({
      where: {
        payoutHoldReason: { not: null },
      },
      orderBy: { updatedAt: "desc" },
      take: 20,
      select: {
        id: true,
        amountCents: true,
        platformFeeCents: true,
        hostPayoutCents: true,
        payoutHoldReason: true,
        booking: {
          select: {
            id: true,
            confirmationCode: true,
            listing: { select: { title: true } },
          },
        },
        updatedAt: true,
      },
    }),
    prisma.stripeLedgerEntry.findMany({
      where: stripeLedgerWhere,
      orderBy: { createdAt: "desc" },
      take: 120,
      select: {
        id: true,
        objectType: true,
        stripeObjectId: true,
        amountCents: true,
        feeCents: true,
        currency: true,
        status: true,
        platformPaymentId: true,
        createdAt: true,
      },
    }),
    prisma.brokerPayout.findMany({
      where: { status: { in: ["PENDING", "APPROVED"] } },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        status: true,
        totalAmountCents: true,
        createdAt: true,
        broker: { select: { id: true, name: true, email: true } },
      },
    }),
  ]);

  const totalRevenue = payments.reduce((s, p) => s + p.amountCents, 0);
  const totalFees = payments.reduce((s, p) => s + (p.stripeFeeCents ?? 0), 0);
  const brokerPayouts = commissions.reduce((s, c) => s + c.brokerAmountCents, 0);
  const platformCommissions = commissions.reduce((s, c) => s + c.platformAmountCents, 0);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthlyRevenue = payments.filter((p) => new Date(p.createdAt) >= monthStart).reduce((s, p) => s + p.amountCents, 0);
  const yearRevenue = yearPaidAgg._sum.amountCents ?? 0;
  const refundTotal = refundSum._sum.refundedAmountCents ?? 0;
  const netAfterFeesRefunds = totalRevenue - totalFees - refundTotal;

  const byType: Record<string, number> = {};
  for (const p of payments) {
    byType[p.paymentType] = (byType[p.paymentType] ?? 0) + p.amountCents;
  }
  const featuredRevenue = byType.featured_listing ?? 0;

  const fmt = (cents: number) => `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  const queueCollectCents =
    pendingPlatformPaymentsRows.reduce((sum, row) => sum + row.amountCents, 0) +
    pendingBrokerCommissionRows.reduce((sum, row) => sum + row.brokerAmountCents, 0);
  const queueRetryCents = failedPlatformPaymentsRows.reduce((sum, row) => sum + row.amountCents, 0);
  const queueHeldPayoutCents = payoutHoldRows.reduce((sum, row) => sum + (row.hostPayoutCents ?? 0), 0);

  function renderOpsTargetLink(args: {
    fsboListingId?: string | null;
    dealId?: string | null;
    bookingId?: string | null;
    fallbackHref: string;
    fallbackLabel: string;
  }) {
    if (args.fsboListingId) {
      return (
        <Link href={`/admin/fsbo/${args.fsboListingId}`} className="text-premium-gold hover:underline">
          Open listing
        </Link>
      );
    }
    if (args.dealId) {
      return (
        <Link href={`/dashboard/deals/${args.dealId}`} className="text-premium-gold hover:underline">
          Open deal
        </Link>
      );
    }
    if (args.bookingId) {
      return (
        <Link href="/admin/finance/payouts" className="text-premium-gold hover:underline">
          Review booking payout
        </Link>
      );
    }
    return (
      <Link href={args.fallbackHref} className="text-premium-gold hover:underline">
        {args.fallbackLabel}
      </Link>
    );
  }

  const bnhubCommissionRate = getBnhubCommissionRate();
  const stripeGrossTracked = stripeLedgerWindow.reduce((sum, row) => sum + row.amountCents, 0);
  const stripeFeesTracked = stripeLedgerWindow.reduce((sum, row) => sum + row.feeCents, 0);
  const stripeNetTracked = stripeGrossTracked - stripeFeesTracked;
  const stripeFailedRows = stripeLedgerWindow.filter((row) => /failed/i.test(row.status));
  const stripeRefundRows = stripeLedgerWindow.filter((row) => /refund/i.test(row.objectType) || /refund/i.test(row.status));
  const stripeChargeRows = stripeLedgerWindow.filter((row) => row.objectType === "charge" || row.objectType === "checkout_session");
  const stripeUnmappedRows = stripeLedgerWindow.filter((row) => !row.platformPaymentId);
  const stripeFeeAnomalyRows = stripeLedgerWindow.filter(
    (row) => row.amountCents > 0 && (row.feeCents < 0 || row.feeCents > row.amountCents)
  );
  const commissionDisplayPct =
    Math.abs(bnhubCommissionRate * 100 - Math.round(bnhubCommissionRate * 100)) < 1e-6
      ? `${Math.round(bnhubCommissionRate * 100)}%`
      : `${(bnhubCommissionRate * 100).toFixed(1)}%`;

  const bnhubGrossVol = bnhubBookingVolume._sum.amountCents ?? 0;
  const bnhubPlatformRev = bnhubBookingVolume._sum.platformFeeCents ?? 0;
  const bnhubHostOut = bnhubBookingVolume._sum.hostPayoutCents ?? 0;

  const fsboGross = fsboPlatformPaymentAgg._sum.amountCents ?? 0;
  const fsboPlatformRev =
    fsboPlatformPaymentAgg._sum.platformFeeCents ?? fsboPlatformPaymentAgg._sum.amountCents ?? 0;
  const totalPlatformFeesRange = bnhubPlatformRev + fsboPlatformRev;

  return (
    <HubLayout
      title="Finance"
      hubKey="admin"
      navigation={hubNavigation.admin}
      showAdminInSwitcher={navRole === "admin"}
    >
      <main className="min-h-screen bg-slate-950 text-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-8">
        <Link href="/admin/dashboard" className="text-sm text-amber-400 hover:text-amber-300">
          ← Control center
        </Link>
        <h1 className="mt-4 text-2xl font-semibold">Financial dashboard</h1>
        <p className="mt-1 text-sm text-slate-400">
          Role: {user?.role}. Accountant access is read-only for financial data — no system configuration.
        </p>
        <p className="mt-2 rounded-lg border border-amber-900/50 bg-amber-950/30 p-3 text-xs text-amber-200/90">
          <strong>Tax disclaimer:</strong> Figures are for internal transparency. GST/QST, income reporting, and other obligations depend on jurisdiction (e.g. Canada/Quebec). A licensed accountant must validate compliance.
        </p>

        <FinanceHubTabs />

        <form className="mt-6 flex flex-wrap items-end gap-3" method="get">
          <div>
            <label className="block text-xs text-slate-500">From</label>
            <input type="date" name="dateFrom" defaultValue={params.dateFrom ?? ""} className="input-premium mt-1" />
          </div>
          <div>
            <label className="block text-xs text-slate-500">To</label>
            <input type="date" name="dateTo" defaultValue={params.dateTo ?? ""} className="input-premium mt-1" />
          </div>
          <button type="submit" className="btn-primary">
            Apply
          </button>
        </form>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="card-premium p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Total revenue (range)</p>
            <p className="mt-1 text-xl font-semibold text-emerald-400">{fmt(totalRevenue)}</p>
            <p className="mt-1 text-[10px] text-slate-600">All paid platform checkouts (gross).</p>
          </div>
          <div className="card-premium p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">This month</p>
            <p className="mt-1 text-xl font-semibold text-slate-100">{fmt(monthlyRevenue)}</p>
          </div>
          <div className="card-premium p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">This year (paid)</p>
            <p className="mt-1 text-xl font-semibold text-slate-100">{fmt(yearRevenue)}</p>
          </div>
          <div className="card-premium p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Net (gross − fees − refunds)</p>
            <p className="mt-1 text-xl font-semibold text-cyan-300">{fmt(netAfterFeesRefunds)}</p>
            <p className="mt-1 text-[10px] text-slate-600">Estimate; reconcile with Stripe & CPA.</p>
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="card-premium p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Platform fees (BNHUB + FSBO)</p>
            <p className="mt-1 text-xl font-semibold text-amber-300">{fmt(totalPlatformFeesRange)}</p>
            <p className="mt-1 text-[10px] text-slate-600">
              BNHUB from booking ledger + FSBO listing fees (stored splits).
            </p>
          </div>
          <div className="card-premium p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">FSBO listing revenue</p>
            <p className="mt-1 text-xl font-semibold text-amber-200">{fmt(fsboPlatformRev)}</p>
            <p className="mt-1 text-[10px] text-slate-600">Flat publish fees; 100% platform.</p>
          </div>
          <div className="card-premium p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Total host payouts (BNHUB)</p>
            <p className="mt-1 text-xl font-semibold text-cyan-300">{fmt(bnhubHostOut)}</p>
            <p className="mt-1 text-[10px] text-slate-600">Guest gross − platform fee per booking.</p>
          </div>
          <div className="card-premium p-4 border border-slate-700/80">
            <p className="text-xs uppercase tracking-wide text-slate-500">Money flow (reference)</p>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
              BNHUB: {BNHUB_PLATFORM_COMMISSION_LABEL}. FSBO: {FSBO_BASIC_FEE_LABEL} — platform keeps publish fee.
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="card-premium p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Successful payments</p>
            <p className="mt-1 text-lg font-semibold text-emerald-300">{paidCount}</p>
          </div>
          <div className="card-premium p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Failed</p>
            <p className="mt-1 text-lg font-semibold text-rose-300">{failedCount}</p>
          </div>
          <div className="card-premium p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Pending</p>
            <p className="mt-1 text-lg font-semibold text-amber-300">{pendingPayCount}</p>
          </div>
          <div className="card-premium p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">With refunds</p>
            <p className="mt-1 text-lg font-semibold text-slate-200">{refundedPaymentCount}</p>
          </div>
        </div>

        <div className="mt-6 card-premium p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-200">Collection queue</h2>
              <p className="mt-1 text-[11px] text-slate-500">
                What the platform should collect, retry, settle, or release next.
              </p>
            </div>
            <p className="text-sm font-semibold text-amber-300">Queue value: {fmt(queueCollectCents)}</p>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-amber-500/20 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Pending collection</p>
              <p className="mt-2 text-2xl font-semibold text-amber-300">{pendingPlatformPaymentsRows.length}</p>
              <p className="mt-2 text-xs text-slate-400">{fmt(queueCollectCents)} waiting to be collected or settled.</p>
            </div>
            <div className="rounded-xl border border-rose-500/20 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Retry needed</p>
              <p className="mt-2 text-2xl font-semibold text-rose-300">{failedPlatformPaymentsRows.length}</p>
              <p className="mt-2 text-xs text-slate-400">{fmt(queueRetryCents)} currently sitting in failed payments.</p>
            </div>
            <div className="rounded-xl border border-cyan-500/20 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Broker settlement due</p>
              <p className="mt-2 text-2xl font-semibold text-cyan-300">{pendingBrokerCommissionRows.length}</p>
              <p className="mt-2 text-xs text-slate-400">
                {fmt(pendingBrokerCommissionRows.reduce((sum, row) => sum + row.brokerAmountCents, 0))} owed to brokers.
              </p>
            </div>
            <div className="rounded-xl border border-fuchsia-500/20 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Payouts on hold</p>
              <p className="mt-2 text-2xl font-semibold text-fuchsia-300">{payoutHoldRows.length}</p>
              <p className="mt-2 text-xs text-slate-400">{fmt(queueHeldPayoutCents)} waiting on payout release review.</p>
            </div>
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-2">
            <div className="rounded-xl border border-amber-500/20 bg-amber-950/10 p-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-white">Pending collection</h3>
                <Link href="/admin/finance/transactions" className="text-xs text-premium-gold hover:underline">
                  Open transactions
                </Link>
              </div>
              <div className="mt-3 space-y-3">
                {pendingPlatformPaymentsRows.length === 0 ? (
                  <p className="text-xs text-slate-500">No pending platform payments.</p>
                ) : (
                  pendingPlatformPaymentsRows.map((row) => (
                    <div key={row.id} className="rounded-lg border border-white/10 bg-black/20 p-3 text-xs text-slate-300">
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-medium text-white">
                          {row.paymentType} · {fmt(row.amountCents)}
                        </p>
                        {renderOpsTargetLink({
                          fsboListingId: row.fsboListingId,
                          dealId: row.dealId,
                          bookingId: row.bookingId,
                          fallbackHref: "/admin/finance/transactions",
                          fallbackLabel: "Open transactions",
                        })}
                      </div>
                      <p className="mt-1 text-slate-400">
                        {row.fsboListing?.title ?? row.fsboListingId ?? row.dealId ?? row.bookingId ?? row.id}
                      </p>
                      <div className="mt-2">
                        <FinanceActionButton
                          endpoint="/api/admin/finance/review-flags"
                          method="POST"
                          body={{ entityType: "PlatformPayment", entityId: row.id, reason: "pending_collection_review" }}
                          label="Flag manual review"
                          busyLabel="Flagging..."
                          className="text-premium-gold hover:underline disabled:opacity-50"
                        />
                      </div>
                      <p className="mt-2 text-slate-500">{row.createdAt.toISOString().slice(0, 19)}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-xl border border-rose-500/20 bg-rose-950/10 p-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-white">Failed / retry needed</h3>
                <Link href="/admin/finance/transactions" className="text-xs text-premium-gold hover:underline">
                  Review failures
                </Link>
              </div>
              <div className="mt-3 space-y-3">
                {failedPlatformPaymentsRows.length === 0 ? (
                  <p className="text-xs text-slate-500">No failed platform payments.</p>
                ) : (
                  failedPlatformPaymentsRows.map((row) => (
                    <div key={row.id} className="rounded-lg border border-white/10 bg-black/20 p-3 text-xs text-slate-300">
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-medium text-white">
                          {row.paymentType} · {fmt(row.amountCents)}
                        </p>
                        {renderOpsTargetLink({
                          fsboListingId: row.fsboListingId,
                          dealId: row.dealId,
                          bookingId: row.bookingId,
                          fallbackHref: "/admin/finance/transactions",
                          fallbackLabel: "Review failure",
                        })}
                      </div>
                      <p className="mt-1 text-slate-400">
                        {row.fsboListing?.title ?? row.fsboListingId ?? row.dealId ?? row.bookingId ?? row.id}
                      </p>
                      <div className="mt-2">
                        <FinanceActionButton
                          endpoint="/api/admin/finance/review-flags"
                          method="POST"
                          body={{ entityType: "PlatformPayment", entityId: row.id, reason: "failed_payment_review" }}
                          label="Flag manual review"
                          busyLabel="Flagging..."
                          className="text-premium-gold hover:underline disabled:opacity-50"
                        />
                      </div>
                      <p className="mt-2 text-slate-500">{row.createdAt.toISOString().slice(0, 19)}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-xl border border-cyan-500/20 bg-cyan-950/10 p-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-white">Broker money owed</h3>
                <Link href="/admin/commissions" className="text-xs text-premium-gold hover:underline">
                  Open commissions
                </Link>
              </div>
              <div className="mt-3 space-y-3">
                {pendingBrokerCommissionRows.length === 0 ? (
                  <p className="text-xs text-slate-500">No pending broker commissions.</p>
                ) : (
                  pendingBrokerCommissionRows.map((row) => (
                    <div key={row.id} className="rounded-lg border border-white/10 bg-black/20 p-3 text-xs text-slate-300">
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-medium text-white">
                          Broker share {fmt(row.brokerAmountCents)} · Platform share {fmt(row.platformAmountCents)}
                        </p>
                        {renderOpsTargetLink({
                          fsboListingId: row.payment.fsboListingId,
                          dealId: row.payment.dealId,
                          fallbackHref: "/admin/commissions",
                          fallbackLabel: "Open commissions",
                        })}
                      </div>
                      <p className="mt-1 text-slate-400">
                        {row.payment.fsboListing?.title ?? row.payment.fsboListingId ?? row.payment.dealId ?? row.payment.id}
                      </p>
                      <div className="mt-2">
                        <FinanceActionButton
                          endpoint="/api/admin/finance/review-flags"
                          method="POST"
                          body={{ entityType: "BrokerCommission", entityId: row.id, reason: "broker_commission_review" }}
                          label="Flag manual review"
                          busyLabel="Flagging..."
                          className="text-premium-gold hover:underline disabled:opacity-50"
                        />
                      </div>
                      <p className="mt-2 text-slate-500">{row.createdAt.toISOString().slice(0, 19)}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-xl border border-fuchsia-500/20 bg-fuchsia-950/10 p-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-white">Payout hold / release review</h3>
                <Link href="/admin/finance/payouts" className="text-xs text-premium-gold hover:underline">
                  Open payouts
                </Link>
              </div>
              <div className="mt-3 space-y-3">
                {payoutHoldRows.length === 0 ? (
                  <p className="text-xs text-slate-500">No BNHUB payout holds right now.</p>
                ) : (
                  payoutHoldRows.map((row) => (
                    <div key={row.id} className="rounded-lg border border-white/10 bg-black/20 p-3 text-xs text-slate-300">
                      <p className="font-medium text-white">
                        {row.booking.confirmationCode ?? row.booking.id.slice(0, 8)} · {row.payoutHoldReason ?? "hold"}
                      </p>
                      <p className="mt-1 text-slate-400">
                        {row.booking.listing.title} · total {fmt(row.amountCents)} · platform {fmt(row.platformFeeCents ?? 0)} · host payout {fmt(row.hostPayoutCents ?? 0)}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-3">
                        <Link href="/admin/finance/payouts" className="text-premium-gold hover:underline">
                          Review payout hold
                        </Link>
                        <FinanceActionButton
                          endpoint="/api/admin/finance/review-flags"
                          method="POST"
                          body={{ entityType: "Payment", entityId: row.id, reason: "payout_hold_review" }}
                          label="Flag legal-finance review"
                          busyLabel="Flagging..."
                          className="text-fuchsia-300 hover:underline disabled:opacity-50"
                        />
                      </div>
                      <p className="mt-2 text-slate-500">{row.updatedAt.toISOString().slice(0, 19)}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 card-premium p-4">
          <h2 className="text-sm font-semibold text-slate-200">BNHUB · Stripe Connect (booking settlements)</h2>
          <p className="mt-2 text-xs text-slate-500">
            Commission rate (env <code className="text-slate-400">BNHUB_COMMISSION_RATE</code>):{" "}
            <strong className="text-amber-300">{commissionDisplayPct}</strong>
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm text-slate-400">
            <div>
              <p className="text-xs uppercase text-slate-500">Gross booking volume</p>
              <p className="mt-1 font-semibold text-emerald-300">{fmt(bnhubGrossVol)}</p>
              <p className="mt-1 text-[10px] text-slate-600">Total charged to guests (range filter).</p>
            </div>
            <div>
              <p className="text-xs uppercase text-slate-500">Total platform revenue</p>
              <p className="mt-1 font-semibold text-amber-300">{fmt(bnhubPlatformRev)}</p>
              <p className="mt-1 text-[10px] text-slate-600">Stored application fee per payment.</p>
            </div>
            <div>
              <p className="text-xs uppercase text-slate-500">Total host payouts</p>
              <p className="mt-1 font-semibold text-cyan-300">{fmt(bnhubHostOut)}</p>
              <p className="mt-1 text-[10px] text-slate-600">Transfer amounts (ledger).</p>
            </div>
            <div>
              <p className="text-xs uppercase text-slate-500">Hosts payout-blocked</p>
              <p className="mt-1 font-semibold text-rose-300">{bnhubHostsPayoutBlocked}</p>
              <p className="mt-1 text-[10px] text-slate-600">Listings exist but Connect incomplete.</p>
            </div>
          </div>
          <div className="mt-3 rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2 text-[11px] text-slate-500">
            <strong className="text-slate-400">Completed BNHUB bookings (paid):</strong>{" "}
            <span className="font-mono text-slate-300">{bnhubCompletedBookingsCount}</span>
            <span className="mx-2 text-slate-600">·</span>
            Platform commission and host payout sums use stored{" "}
            <code className="text-slate-400">platformFeeCents</code> /{" "}
            <code className="text-slate-400">hostPayoutCents</code> on each payment record (not inferred).
          </div>
          <p className="mt-2 text-[10px] text-slate-600">
            Transfer timing follows each host&apos;s Stripe schedule; use Stripe Dashboard for payout &
            dispute status.
          </p>
          {bnhubRecentPayments.length > 0 && (
            <div className="mt-4 overflow-x-auto rounded-lg border border-slate-800">
              <table className="min-w-full text-left text-[11px] text-slate-400">
                <thead className="bg-slate-900/80 text-slate-500">
                  <tr>
                    <th className="p-2">When</th>
                    <th className="p-2">Booking ID</th>
                    <th className="p-2">Code</th>
                    <th className="p-2">Listing</th>
                    <th className="p-2">Guest</th>
                    <th className="p-2">Source</th>
                    <th className="p-2">Total</th>
                    <th className="p-2">Platform fee</th>
                    <th className="p-2">Host payout</th>
                    <th className="p-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bnhubRecentPayments.map((row) => (
                    <tr key={row.booking.id} className="border-t border-slate-800">
                      <td className="p-2 whitespace-nowrap">{row.updatedAt.toISOString().slice(0, 19)}</td>
                      <td className="p-2 font-mono text-[10px] text-slate-300">
                        {row.booking.id.slice(0, 8)}…
                      </td>
                      <td className="p-2 font-mono text-slate-200">{row.booking.confirmationCode ?? "—"}</td>
                      <td className="p-2 max-w-[120px] truncate" title={row.booking.listing.title}>
                        {row.booking.listing.title}
                      </td>
                      <td className="p-2 max-w-[100px] truncate" title={row.booking.guest.email}>
                        {row.booking.guest.email}
                      </td>
                      <td className="p-2 font-mono text-[10px] text-slate-400">{row.booking.bookingSource}</td>
                      <td className="p-2">{fmt(row.amountCents)}</td>
                      <td className="p-2">{fmt(row.platformFeeCents ?? 0)}</td>
                      <td className="p-2">{fmt(row.hostPayoutCents ?? 0)}</td>
                      <td className="p-2 text-slate-300">{row.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-6 card-premium p-4">
          <h2 className="text-sm font-semibold text-slate-200">FSBO · Listing publish fees</h2>
          <p className="mt-2 text-xs text-slate-500">
            Gross (range): <strong className="text-emerald-300">{fmt(fsboGross)}</strong> · Recorded platform fee
            (typically 100% of gross): <strong className="text-amber-300">{fmt(fsboPlatformRev)}</strong>
          </p>
        </div>

        <div id="finance-payments" className="mt-6 card-premium scroll-mt-24 p-4">
          <h2 className="text-sm font-semibold text-slate-200">Settlements — BNHUB &amp; FSBO</h2>
          <p className="mt-1 text-[11px] text-slate-500">
            Rows from `platform_payments` with stored totals / fees. Status: paid = completed checkout.
          </p>
          {unifiedBnFsboRows.length > 0 ? (
            <div className="mt-4 overflow-x-auto rounded-lg border border-slate-800">
              <table className="min-w-full text-left text-[11px] text-slate-400">
                <thead className="bg-slate-900/80 text-slate-500">
                  <tr>
                    <th className="p-2">When</th>
                    <th className="p-2">Type</th>
                    <th className="p-2">Ref</th>
                    <th className="p-2">Total</th>
                    <th className="p-2">Platform fee</th>
                    <th className="p-2">Host / payout</th>
                    <th className="p-2">Status</th>
                    <th className="p-2">Contract</th>
                  </tr>
                </thead>
                <tbody>
                  {unifiedBnFsboRows.map((row) => (
                    <tr key={row.id} className="border-t border-slate-800">
                      <td className="p-2 whitespace-nowrap">{row.createdAt.toISOString().slice(0, 19)}</td>
                      <td className="p-2">
                        {row.paymentType === "fsbo_publish" ? (
                          <span className="text-amber-200">FSBO</span>
                        ) : (
                          <span className="text-cyan-200">BNHUB</span>
                        )}
                      </td>
                      <td className="p-2 font-mono text-[10px] text-slate-300">
                        {row.paymentType === "fsbo_publish"
                          ? row.fsboListing?.title ?? row.fsboListingId?.slice(0, 8) ?? "—"
                          : row.bookingId?.slice(0, 8) ?? "—"}
                      </td>
                      <td className="p-2">{fmt(row.amountCents)}</td>
                      <td className="p-2">{fmt(row.platformFeeCents ?? 0)}</td>
                      <td className="p-2">{fmt(row.hostPayoutCents ?? 0)}</td>
                      <td className="p-2 uppercase text-slate-400">{row.status}</td>
                      <td className="p-2 font-mono text-[10px]">
                        {row.linkedContractId ? (
                          <a
                            href={`/api/contracts/${row.linkedContractId}/download`}
                            className="text-amber-400 hover:underline"
                          >
                            {row.linkedContractType ?? row.linkedContractId.slice(0, 8)}…
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-3 text-xs text-slate-500">No BNHUB/FSBO platform payments in this range.</p>
          )}
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="card-premium p-4">
            <h2 className="text-sm font-semibold text-slate-200">Revenue by source</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-400">
              <li>BNHUB rentals (booking): {fmt(byType.booking ?? 0)}</li>
              <li>FSBO publish: {fmt(byType.fsbo_publish ?? 0)}</li>
              <li>Property sales (deposit + closing): {fmt((byType.deposit ?? 0) + (byType.closing_fee ?? 0))}</li>
              <li>Subscriptions: {fmt(byType.subscription ?? 0)}</li>
              <li>Featured listings: {fmt(featuredRevenue)}</li>
              <li>Lead unlock: {fmt(byType.lead_unlock ?? 0)}</li>
            </ul>
          </div>
          <div id="finance-commissions" className="card-premium scroll-mt-24 p-4">
            <h2 className="text-sm font-semibold text-slate-200">Commissions & broker payouts</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-400">
              <li>Platform commission (range): {fmt(platformCommissions)}</li>
              <li>Broker share in range: {fmt(brokerPayouts)}</li>
              <li>Broker owed (pending commissions): {fmt(pendingCommissions._sum.brokerAmountCents ?? 0)}</li>
              <li>Broker marked paid: {fmt(paidCommissions._sum.brokerAmountCents ?? 0)}</li>
              <li>Stripe fees (range): {fmt(totalFees)}</li>
              <li>Refunds recorded (range): {fmt(refundTotal)}</li>
            </ul>
            <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-white">Broker payout workflow</h3>
                <Link href="/admin/finance/payouts" className="text-xs text-premium-gold hover:underline">
                  Open payouts
                </Link>
              </div>
              <div className="mt-3 space-y-3">
                {brokerPayoutBatches.length === 0 ? (
                  <p className="text-xs text-slate-500">No pending or approved broker payout batches.</p>
                ) : (
                  brokerPayoutBatches.map((batch) => (
                    <div key={batch.id} className="rounded-lg border border-white/10 bg-slate-950/40 p-3 text-xs text-slate-300">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-white">
                            {batch.broker?.name ?? batch.broker?.email ?? batch.broker?.id ?? "Broker"} · {fmt(batch.totalAmountCents)}
                          </p>
                          <p className="mt-1 text-slate-400">
                            Batch {batch.id.slice(0, 8)}… · {batch.status} · {batch.createdAt.toISOString().slice(0, 19)}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                          {batch.status === "PENDING" ? (
                            <FinanceActionButton
                              endpoint={`/api/admin/finance/payouts/${batch.id}`}
                              method="PATCH"
                              body={{ action: "approve" }}
                              label="Approve batch"
                              busyLabel="Approving..."
                              className="text-premium-gold hover:underline disabled:opacity-50"
                            />
                          ) : null}
                          {batch.status === "APPROVED" ? (
                            <FinanceActionButton
                              endpoint={`/api/admin/finance/payouts/${batch.id}`}
                              method="PATCH"
                              body={{ action: "mark_paid" }}
                              label="Mark paid"
                              busyLabel="Marking paid..."
                              confirmMessage="Mark this broker payout batch as paid?"
                              className="text-emerald-300 hover:underline disabled:opacity-50"
                            />
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href={`/api/admin/finance/export?format=csv&type=transactions${params.dateFrom ? `&dateFrom=${params.dateFrom}` : ""}${params.dateTo ? `&dateTo=${params.dateTo}` : ""}`}
            className="btn-secondary text-sm"
          >
            Export CSV (Excel-compatible)
          </a>
          <a
            href={`/api/admin/finance/export?format=pdf&type=transactions${params.dateFrom ? `&dateFrom=${params.dateFrom}` : ""}${params.dateTo ? `&dateTo=${params.dateTo}` : ""}`}
            className="btn-secondary text-sm"
          >
            Export PDF (sample)
          </a>
          <Link href="/admin/finance/transactions" className="btn-secondary text-sm">
            Platform transactions
          </Link>
          <Link href="/admin/finance/payouts" className="btn-secondary text-sm">
            Broker payouts
          </Link>
          <Link href="/admin/finance/tax" className="btn-primary text-sm">
            Tax documents
          </Link>
          <Link href="/admin/finance/reports" className="btn-secondary text-sm">
            Reports hub
          </Link>
          <Link href="/admin/commissions" className="btn-secondary text-sm">
            Commissions detail
          </Link>
          <Link href="/admin/transactions" className="btn-secondary text-sm">
            RE deal monitor
          </Link>
        </div>

        <div className="mt-8 card-premium p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-200">Stripe movement monitor</h2>
              <p className="mt-1 text-[11px] text-slate-500">
                Stripe-side money flow, fees, failures, and ledger movement captured by webhook sync.
              </p>
            </div>
            <Link href="/admin/finance/transactions" className="text-xs text-premium-gold hover:underline">
              Open transaction review
            </Link>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-emerald-500/20 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Stripe gross tracked</p>
              <p className="mt-2 text-2xl font-semibold text-emerald-300">{fmt(stripeGrossTracked)}</p>
              <p className="mt-2 text-xs text-slate-400">{stripeChargeRows.length} charge or checkout ledger rows in range.</p>
            </div>
            <div className="rounded-xl border border-amber-500/20 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Stripe fees tracked</p>
              <p className="mt-2 text-2xl font-semibold text-amber-300">{fmt(stripeFeesTracked)}</p>
              <p className="mt-2 text-xs text-slate-400">Processing fees recorded from Stripe ledger entries.</p>
            </div>
            <div className="rounded-xl border border-cyan-500/20 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Net after Stripe fees</p>
              <p className="mt-2 text-2xl font-semibold text-cyan-300">{fmt(stripeNetTracked)}</p>
              <p className="mt-2 text-xs text-slate-400">Tracked gross minus Stripe fees in the selected range.</p>
            </div>
            <div className="rounded-xl border border-rose-500/20 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Failures / refunds</p>
              <p className="mt-2 text-2xl font-semibold text-rose-300">
                {stripeFailedRows.length} / {stripeRefundRows.length}
              </p>
              <p className="mt-2 text-xs text-slate-400">Failed statuses and refund movements needing finance attention.</p>
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2 text-[11px] text-slate-500">
            Stripe monitoring helps admin verify:
            <span className="mx-1 text-slate-300">money captured</span>,
            <span className="mx-1 text-slate-300">fees charged</span>,
            <span className="mx-1 text-slate-300">failures</span>, and
            <span className="mx-1 text-slate-300">refund movement</span>.
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-2">
            <div className="rounded-xl border border-rose-500/20 bg-rose-950/10 p-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-white">Stripe exception queue</h3>
                <Link href="/admin/finance/transactions" className="text-xs text-premium-gold hover:underline">
                  Open transaction review
                </Link>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                  <p className="text-[10px] uppercase tracking-wide text-slate-500">Failed</p>
                  <p className="mt-2 text-lg font-semibold text-rose-300">{stripeFailedRows.length}</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                  <p className="text-[10px] uppercase tracking-wide text-slate-500">Refunds</p>
                  <p className="mt-2 text-lg font-semibold text-amber-300">{stripeRefundRows.length}</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                  <p className="text-[10px] uppercase tracking-wide text-slate-500">Unmapped</p>
                  <p className="mt-2 text-lg font-semibold text-fuchsia-300">{stripeUnmappedRows.length}</p>
                </div>
              </div>
              <div className="mt-3 space-y-3">
                {[...stripeFailedRows, ...stripeRefundRows, ...stripeUnmappedRows]
                  .slice(0, 8)
                  .map((row) => (
                    <div key={`stripe-ex-${row.id}`} className="rounded-lg border border-white/10 bg-black/20 p-3 text-xs text-slate-300">
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-medium text-white">
                          {row.objectType} · {fmt(row.amountCents)}
                        </p>
                        <Link href="/admin/finance/transactions" className="text-premium-gold hover:underline">
                          Review Stripe row
                        </Link>
                      </div>
                      <p className="mt-1 font-mono text-[10px] text-slate-400">{row.stripeObjectId}</p>
                      <p className="mt-1 text-slate-400">
                        Status {row.status} · Fee {fmt(row.feeCents)} · {row.platformPaymentId ? `Linked ${row.platformPaymentId.slice(0, 8)}…` : "No linked platform payment"}
                      </p>
                      <div className="mt-2">
                        <FinanceActionButton
                          endpoint="/api/admin/finance/review-flags"
                          method="POST"
                          body={{ entityType: "StripeLedgerEntry", entityId: row.id, reason: "stripe_exception_review" }}
                          label="Flag manual review"
                          busyLabel="Flagging..."
                          className="text-premium-gold hover:underline disabled:opacity-50"
                        />
                      </div>
                      <p className="mt-2 text-slate-500">{row.createdAt.toISOString().slice(0, 19)}</p>
                    </div>
                  ))}
                {stripeFailedRows.length === 0 && stripeRefundRows.length === 0 && stripeUnmappedRows.length === 0 ? (
                  <p className="text-xs text-slate-500">No Stripe exceptions in the selected range.</p>
                ) : null}
              </div>
            </div>

            <div className="rounded-xl border border-amber-500/20 bg-amber-950/10 p-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-white">Reconciliation watch</h3>
                <Link href="/admin/finance/transactions" className="text-xs text-premium-gold hover:underline">
                  Open reconciliation
                </Link>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                  <p className="text-[10px] uppercase tracking-wide text-slate-500">Ledger rows linked</p>
                  <p className="mt-2 text-lg font-semibold text-emerald-300">
                    {stripeLedgerWindow.length - stripeUnmappedRows.length} / {stripeLedgerWindow.length}
                  </p>
                </div>
                <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                  <p className="text-[10px] uppercase tracking-wide text-slate-500">Fee anomalies</p>
                  <p className="mt-2 text-lg font-semibold text-amber-300">{stripeFeeAnomalyRows.length}</p>
                </div>
              </div>
              <div className="mt-3 space-y-3">
                {stripeFeeAnomalyRows.length === 0 ? (
                  <p className="text-xs text-slate-500">No fee anomalies detected in Stripe ledger rows.</p>
                ) : (
                  stripeFeeAnomalyRows.slice(0, 6).map((row) => (
                    <div key={`stripe-anom-${row.id}`} className="rounded-lg border border-white/10 bg-black/20 p-3 text-xs text-slate-300">
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-medium text-white">
                          {row.objectType} anomaly · {fmt(row.amountCents)}
                        </p>
                        <Link href="/admin/finance/transactions" className="text-premium-gold hover:underline">
                          Review anomaly
                        </Link>
                      </div>
                      <p className="mt-1 font-mono text-[10px] text-slate-400">{row.stripeObjectId}</p>
                      <p className="mt-1 text-slate-400">Fee {fmt(row.feeCents)} vs amount {fmt(row.amountCents)}</p>
                      <div className="mt-2">
                        <FinanceActionButton
                          endpoint="/api/admin/finance/review-flags"
                          method="POST"
                          body={{ entityType: "StripeLedgerEntry", entityId: row.id, reason: "stripe_fee_anomaly_review" }}
                          label="Flag anomaly"
                          busyLabel="Flagging..."
                          className="text-premium-gold hover:underline disabled:opacity-50"
                        />
                      </div>
                      <p className="mt-2 text-slate-500">{row.createdAt.toISOString().slice(0, 19)}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <h3 className="mt-5 text-sm font-semibold text-slate-200">Recent Stripe ledger</h3>
          <div className="mt-2 overflow-x-auto rounded-lg border border-slate-800">
            <table className="min-w-full text-left text-xs text-slate-400">
              <thead className="bg-slate-900/80 text-slate-500">
                <tr>
                  <th className="p-2">Date</th>
                  <th className="p-2">Type</th>
                  <th className="p-2">Stripe object</th>
                  <th className="p-2">Amount</th>
                  <th className="p-2">Fee</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Linked payment</th>
                </tr>
              </thead>
              <tbody>
                {ledgerRecent.map((row) => (
                  <tr key={row.id} className="border-t border-slate-800">
                    <td className="p-2">{row.createdAt.toISOString().slice(0, 19)}</td>
                    <td className="p-2">{row.objectType}</td>
                    <td className="p-2 font-mono text-[10px] text-slate-300">{row.stripeObjectId.slice(0, 16)}…</td>
                    <td className="p-2">{fmt(row.amountCents)}</td>
                    <td className="p-2">{fmt(row.feeCents)}</td>
                    <td className="p-2 uppercase">{row.status}</td>
                    <td className="p-2 font-mono text-[10px] text-slate-300">
                      {row.platformPaymentId ? (
                        <Link href="/admin/finance/transactions" className="text-premium-gold hover:underline">
                          {row.platformPaymentId.slice(0, 8)}…
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
    </HubLayout>
  );
}
