import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "@repo/db";
import { requireAuthenticatedUser } from "@/lib/auth/require-session";
import { TENANT_CONTEXT_COOKIE_NAME } from "@/lib/auth/session-cookie";
import { InvoiceDetail } from "@/components/finance/InvoiceDetail";
import { InvoiceActions } from "./InvoiceActions";
import { getVerifiedTenantIdForUser } from "@/modules/tenancy/services/tenant-page-guard";

export default async function FinanceInvoiceDetailPage(props: { params: Promise<{ id: string }> }) {
  const { userId } = await requireAuthenticatedUser();
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { role: true },
  });
  const { id } = await props.params;
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

  const invoice = await prisma.tenantInvoice.findFirst({
    where: { id, tenantId },
    include: { paymentRecords: true },
  });
  if (!invoice) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10 text-slate-100">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link href="/dashboard/finance/invoices" className="text-sm text-emerald-400 hover:underline">
          ← All invoices
        </Link>
        <InvoiceActions invoiceId={invoice.id} status={invoice.status} />
      </div>
      <InvoiceDetail
        invoice={{
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          type: invoice.type,
          status: invoice.status,
          clientName: invoice.clientName,
          clientEmail: invoice.clientEmail,
          lineItems: invoice.lineItems,
          subtotal: invoice.subtotal,
          taxAmount: invoice.taxAmount,
          totalAmount: invoice.totalAmount,
          currency: invoice.currency,
          dueAt: invoice.dueAt?.toISOString() ?? null,
          issuedAt: invoice.issuedAt?.toISOString() ?? null,
          paidAt: invoice.paidAt?.toISOString() ?? null,
          notes: invoice.notes,
        }}
      />
      {invoice.paymentRecords.length > 0 ? (
        <div className="text-sm text-slate-400">
          <p className="font-medium text-slate-300">Payment history</p>
          <ul className="mt-2 space-y-1">
            {invoice.paymentRecords.map((p) => (
              <li key={p.id}>
                {p.status} · {p.amount.toFixed(2)} {p.currency}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
