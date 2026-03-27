import Link from "next/link";
import type { TenantInvoiceStatus } from "@prisma/client";

export type InvoiceListItem = {
  id: string;
  invoiceNumber: string;
  status: TenantInvoiceStatus;
  totalAmount: number;
  currency: string;
  dueAt: string | null;
};

export function InvoiceList(props: { invoices: InvoiceListItem[] }) {
  if (props.invoices.length === 0) {
    return <p className="text-sm text-slate-500">No invoices yet.</p>;
  }
  return (
    <ul className="divide-y divide-white/10 rounded border border-white/10">
      {props.invoices.map((inv) => (
        <li key={inv.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm">
          <div>
            <Link href={`/dashboard/finance/invoices/${inv.id}`} className="font-medium text-emerald-400 hover:underline">
              {inv.invoiceNumber}
            </Link>
            <span className="ml-2 text-slate-500">{inv.status}</span>
          </div>
          <div className="text-slate-300">
            {inv.totalAmount.toFixed(2)} {inv.currency}
            {inv.dueAt ? <span className="ml-2 text-xs text-slate-500">due {inv.dueAt.slice(0, 10)}</span> : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
