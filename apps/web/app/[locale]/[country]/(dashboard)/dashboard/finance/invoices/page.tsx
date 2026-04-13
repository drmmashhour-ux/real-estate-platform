import Link from "next/link";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { requireAuthenticatedUser } from "@/lib/auth/require-session";
import { TENANT_CONTEXT_COOKIE_NAME } from "@/lib/auth/session-cookie";
import { InvoiceList } from "@/components/finance/InvoiceList";
import { getVerifiedTenantIdForUser } from "@/modules/tenancy/services/tenant-page-guard";

export default async function FinanceInvoicesPage() {
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
      <div className="p-8 text-amber-200">
        Invalid workspace.{" "}
        <Link href="/dashboard/tenant" className="text-emerald-400 hover:underline">
          Select a workspace
        </Link>
      </div>
    );
  }

  if (!tenantId) {
    return (
      <div className="p-8 text-slate-200">
        <Link href="/dashboard/tenant" className="text-emerald-400 hover:underline">
          Select a workspace
        </Link>
      </div>
    );
  }

  const invoices = await prisma.tenantInvoice.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      invoiceNumber: true,
      status: true,
      totalAmount: true,
      currency: true,
      dueAt: true,
    },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10 text-slate-100">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Invoices</h1>
        <Link href="/dashboard/finance" className="text-sm text-emerald-400 hover:underline">
          ← Finance home
        </Link>
      </div>
      <InvoiceList
        invoices={invoices.map((inv) => ({
          ...inv,
          dueAt: inv.dueAt?.toISOString() ?? null,
        }))}
      />
    </div>
  );
}
