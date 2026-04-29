import type { TenantInvoiceStatus, TenantInvoiceType } from "@/types/tenancy-finance-enums-client";

export type InvoiceDetailModel = {
  id: string;
  invoiceNumber: string;
  type: TenantInvoiceType;
  status: TenantInvoiceStatus;
  clientName: string | null;
  clientEmail: string | null;
  lineItems: unknown;
  subtotal: number;
  taxAmount: number | null;
  totalAmount: number;
  currency: string;
  dueAt: string | null;
  issuedAt: string | null;
  paidAt: string | null;
  notes: string | null;
};

export function InvoiceDetail(props: { invoice: InvoiceDetailModel }) {
  const { invoice } = props;
  const lines = Array.isArray(invoice.lineItems)
    ? (invoice.lineItems as { label?: string; quantity?: number; unitPrice?: number; amount?: number }[])
    : [];

  return (
    <div className="space-y-6 rounded border border-white/10 bg-white/5 p-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase text-slate-500">Invoice</p>
          <h1 className="text-2xl font-semibold text-slate-100">{invoice.invoiceNumber}</h1>
          <p className="text-sm text-slate-400">
            {invoice.type} · {invoice.status}
          </p>
        </div>
        <div className="text-right text-sm text-slate-400">
          {invoice.clientName ? <div>{invoice.clientName}</div> : null}
          {invoice.clientEmail ? <div>{invoice.clientEmail}</div> : null}
        </div>
      </header>

      <table className="w-full text-left text-sm">
        <thead className="text-xs uppercase text-slate-500">
          <tr>
            <th className="py-2">Item</th>
            <th className="py-2">Qty</th>
            <th className="py-2">Unit</th>
            <th className="py-2 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line, i) => (
            <tr key={i} className="border-t border-white/10">
              <td className="py-2">{line.label ?? "—"}</td>
              <td className="py-2">{line.quantity ?? "—"}</td>
              <td className="py-2">{line.unitPrice ?? "—"}</td>
              <td className="py-2 text-right">{line.amount ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex flex-col items-end gap-1 text-sm">
        <div>Subtotal: {invoice.subtotal.toFixed(2)} {invoice.currency}</div>
        {invoice.taxAmount != null ? (
          <div>Tax: {invoice.taxAmount.toFixed(2)} {invoice.currency}</div>
        ) : null}
        <div className="text-lg font-semibold text-slate-100">
          Total: {invoice.totalAmount.toFixed(2)} {invoice.currency}
        </div>
      </div>

      {invoice.notes ? (
        <p className="text-sm text-slate-400">{invoice.notes}</p>
      ) : null}

      <p className="text-xs text-slate-500">
        This invoice is for internal workflow tracking unless payment integration is enabled.
      </p>
    </div>
  );
}
