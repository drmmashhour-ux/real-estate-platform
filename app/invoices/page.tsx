const invoices = [
  {
    id: "INV-2026-001",
    issuedOn: "Mar 10, 2026",
    dueOn: "Mar 25, 2026",
    amount: "$2,400",
    status: "Paid",
  },
  {
    id: "INV-2026-002",
    issuedOn: "Mar 05, 2026",
    dueOn: "Mar 20, 2026",
    amount: "$1,150",
    status: "Paid",
  },
  {
    id: "INV-2026-003",
    issuedOn: "Feb 28, 2026",
    dueOn: "Mar 14, 2026",
    amount: "$890",
    status: "Paid",
  },
];

const statusColor: Record<string, string> = {
  Paid: "bg-emerald-500/15 text-emerald-300",
  Pending: "bg-amber-500/15 text-amber-300",
  Overdue: "bg-rose-500/15 text-rose-300",
};

export default function InvoicesPage() {
  const payableInvoices = invoices.filter(
    (invoice) => invoice.status === "Pending" || invoice.status === "Overdue",
  );

  return (
    <main className="bg-slate-950 text-slate-50">
      <section className="border-b border-slate-800 bg-slate-950/80">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
            Billing
          </p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
            Invoices
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-400 sm:text-base">
            View all issued invoices and their payment status in one place.
          </p>
        </div>
      </section>

      <section className="bg-slate-950/90">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          {payableInvoices.length === 0 && (
            <div className="mb-5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300 sm:px-5">
              No invoice to pay.
            </div>
          )}
          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 shadow-lg shadow-slate-950/50">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-800">
                <thead className="bg-slate-900/80 text-left text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-4 py-3 sm:px-6">Invoice ID</th>
                    <th className="px-4 py-3 sm:px-6">Issued</th>
                    <th className="px-4 py-3 sm:px-6">Due</th>
                    <th className="px-4 py-3 sm:px-6">Amount</th>
                    <th className="px-4 py-3 sm:px-6">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-sm">
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="text-slate-200">
                      <td className="px-4 py-3 font-medium text-slate-100 sm:px-6">
                        {invoice.id}
                      </td>
                      <td className="px-4 py-3 sm:px-6">{invoice.issuedOn}</td>
                      <td className="px-4 py-3 sm:px-6">{invoice.dueOn}</td>
                      <td className="px-4 py-3 sm:px-6">{invoice.amount}</td>
                      <td className="px-4 py-3 sm:px-6">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            statusColor[invoice.status]
                          }`}
                        >
                          {invoice.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
