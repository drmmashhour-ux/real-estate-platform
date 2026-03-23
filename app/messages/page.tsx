const billingRequestMessage =
  "No invoice is needed. Please renew my current plan and charge my Mastercard.";

export default function MessagesPage() {
  return (
    <main className="bg-slate-950 text-slate-50">
      <section className="border-b border-slate-800 bg-slate-950/80">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
            Messages
          </p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Billing request draft
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-400 sm:text-base">
            The request below keeps your current plan active without issuing an
            invoice and uses your saved Mastercard for payment.
          </p>
        </div>
      </section>

      <section className="bg-slate-950/90">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <article className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg shadow-slate-950/50 sm:p-6">
            <h2 className="text-base font-semibold text-slate-50 sm:text-lg">
              Request details
            </h2>

            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
                <dt className="text-slate-400">Invoice</dt>
                <dd className="mt-1 font-medium text-slate-100">No invoice</dd>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
                <dt className="text-slate-400">Plan action</dt>
                <dd className="mt-1 font-medium text-slate-100">
                  Renew same plan
                </dd>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3 sm:col-span-2">
                <dt className="text-slate-400">Payment method</dt>
                <dd className="mt-1 font-medium text-slate-100">Mastercard</dd>
              </div>
            </dl>

            <div className="mt-5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm text-emerald-100">
              {billingRequestMessage}
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}