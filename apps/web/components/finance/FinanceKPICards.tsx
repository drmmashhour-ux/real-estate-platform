export type FinanceKpiProps = {
  pendingCommissionSplits: number;
  unpaidInvoiceTotal: number;
  paidInvoiceTotal: number;
  incomingPaymentsTotal: number;
  trackedNetCommission: number;
};

export function FinanceKPICards(props: FinanceKpiProps) {
  const cards = [
    { label: "Pending commissions", value: props.pendingCommissionSplits, hint: "Splits awaiting approval" },
    { label: "Invoices awaiting payment", value: props.unpaidInvoiceTotal, hint: "CAD (issued / overdue)", money: true },
    { label: "Paid invoices (total)", value: props.paidInvoiceTotal, hint: "CAD", money: true },
    { label: "Incoming payments", value: props.incomingPaymentsTotal, hint: "CAD (recorded)", money: true },
    { label: "Tracked revenue (net)", value: props.trackedNetCommission, hint: "From deal financials", money: true },
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((c) => (
        <div key={c.label} className="rounded border border-white/10 bg-white/5 p-4">
          <div className="text-xs uppercase tracking-wide text-slate-500">{c.label}</div>
          <div className="mt-1 text-2xl font-semibold text-slate-100">
            {c.money ? formatCad(c.value as number) : String(c.value)}
          </div>
          <div className="mt-1 text-xs text-slate-500">{c.hint}</div>
        </div>
      ))}
    </div>
  );
}

function formatCad(n: number) {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(n);
}
