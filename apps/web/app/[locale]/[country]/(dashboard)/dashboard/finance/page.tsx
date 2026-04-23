import Link from "next/link";
import { cookies } from "next/headers";
import { prisma } from "@repo/db";
import { requireAuthenticatedUser } from "@/lib/auth/require-session";
import { TENANT_CONTEXT_COOKIE_NAME } from "@/lib/auth/session-cookie";
import { FinanceKPICards } from "@/components/finance/FinanceKPICards";
import { InvoiceList } from "@/components/finance/InvoiceList";
import { PaymentRecordList } from "@/components/finance/PaymentRecordList";
import { isStagingEnv } from "@/lib/runtime-env";
import { getVerifiedTenantIdForUser } from "@/modules/tenancy/services/tenant-page-guard";

export default async function FinanceDashboardPage() {
  const { userId } = await requireAuthenticatedUser();
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { role: true },
  });
  const cookieStore = await cookies();
  const rawTenant = cookieStore.get(TENANT_CONTEXT_COOKIE_NAME)?.value;
  const tenantId = await getVerifiedTenantIdForUser(userId, user.role);

  if (rawTenant && !tenantId) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-amber-200">
        <h1 className="text-xl font-semibold">Workspace not available</h1>
        <p className="mt-2 text-sm text-slate-400">
          Your workspace selection is invalid.{" "}
          <Link href="/dashboard/tenant" className="text-emerald-400 hover:underline">
            Choose a workspace
          </Link>{" "}
          again.
        </p>
      </div>
    );
  }

  if (!tenantId) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-slate-200">
        <h1 className="text-2xl font-semibold">Finance</h1>
        <p className="mt-2 text-sm text-slate-400">
          Select a workspace first —{" "}
          <Link href="/dashboard/tenant" className="text-emerald-400 hover:underline">
            open workspace settings
          </Link>
          .
        </p>
      </div>
    );
  }

  const pendingSplits = await prisma.commissionSplit.count({ where: { tenantId, status: "PENDING" } });
  const unpaidAgg = await prisma.tenantInvoice.aggregate({
    where: { tenantId, status: { in: ["ISSUED", "PARTIALLY_PAID", "OVERDUE"] } },
    _sum: { totalAmount: true },
  });
  const paidAgg = await prisma.tenantInvoice.aggregate({
    where: { tenantId, status: "PAID" },
    _sum: { totalAmount: true },
  });
  const payAgg = await prisma.paymentRecord.aggregate({
    where: { tenantId, status: "SUCCEEDED", type: "INCOMING" },
    _sum: { amount: true },
  });
  const dealAgg = await prisma.dealFinancial.aggregate({
    where: { tenantId },
    _sum: { netCommission: true, grossCommission: true },
  });
  const invoices = await prisma.tenantInvoice.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
    take: 8,
    select: {
      id: true,
      invoiceNumber: true,
      status: true,
      totalAmount: true,
      currency: true,
      dueAt: true,
    },
  });
  const payments = await prisma.paymentRecord.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
    take: 8,
    select: {
      id: true,
      type: true,
      status: true,
      amount: true,
      currency: true,
      createdAt: true,
    },
  });

  const staging = isStagingEnv();

  return (
    <div className="mx-auto max-w-5xl space-y-10 px-4 py-10 text-slate-100">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-500/90">Finance</p>
          <h1 className="mt-1 text-3xl font-semibold">Overview</h1>
          <p className="mt-2 max-w-xl text-sm text-slate-400">
            Tracked revenue, invoices, commissions, and manual payment records — all scoped to the current workspace.
          </p>
        </div>
        <nav className="flex flex-wrap gap-3 text-sm">
          <Link href="/dashboard/finance/invoices" className="text-emerald-400 hover:underline">
            Invoices
          </Link>
          <Link href="/dashboard/finance/payments" className="text-emerald-400 hover:underline">
            Payments
          </Link>
          <Link href="/dashboard/finance/commissions" className="text-emerald-400 hover:underline">
            Commissions
          </Link>
          <Link href="/dashboard/billing" className="text-slate-400 hover:text-slate-200">
            Billing
          </Link>
        </nav>
      </header>

      {staging ? (
        <p className="rounded border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          This is a demo financial workflow. No real charge is processed unless payment integration is explicitly configured.
        </p>
      ) : null}

      <FinanceKPICards
        pendingCommissionSplits={pendingSplits}
        unpaidInvoiceTotal={unpaidAgg._sum.totalAmount ?? 0}
        paidInvoiceTotal={paidAgg._sum.totalAmount ?? 0}
        incomingPaymentsTotal={payAgg._sum.amount ?? 0}
        trackedNetCommission={dealAgg._sum.netCommission ?? 0}
      />

      <section className="grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 text-lg font-medium">Recent invoices</h2>
          <InvoiceList
            invoices={invoices.map((inv) => ({
              ...inv,
              dueAt: inv.dueAt?.toISOString() ?? null,
            }))}
          />
        </div>
        <div>
          <h2 className="mb-3 text-lg font-medium">Recent payments</h2>
          <PaymentRecordList
            payments={payments.map((p) => ({
              ...p,
              createdAt: p.createdAt.toISOString(),
            }))}
          />
        </div>
      </section>
    </div>
  );
}
