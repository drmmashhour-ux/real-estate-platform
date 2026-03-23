const invoices: Array<{
  id: string;
  issuedOn: string;
  dueOn: string;
  amount: string;
  status: "Paid" | "Pending" | "Overdue";
}> = [];

const statusColor: Record<string, string> = {
  Paid: "bg-emerald-500/15 text-emerald-300",
  Pending: "bg-amber-500/15 text-amber-300",
  Overdue: "bg-rose-500/15 text-rose-300",
};

export default function InvoicesPage() {
  const hasInvoices = invoices.length > 0;

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
          <div className="mb-5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300 sm:px-5">
            Auto-renew is enabled. Your subscription will renew automatically on
            the same plan.
          </div>
          {!hasInvoices ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center shadow-lg shadow-slate-950/50">
              <p className="text-lg font-semibold text-slate-100">No invoice there.</p>
              <p className="mt-2 text-sm text-slate-400">
                When invoices are issued, they will appear in this section.
              </p>
            </div>
          ) : (
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
          )}
        </div>
      </section>
    </main>
  );
}
