export default function ContactPage() {
  return (
    <main className="bg-slate-950 text-slate-50">
      <section className="border-b border-slate-800 bg-slate-950/80">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
            Contact
          </p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
            Talk to a real estate specialist
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-400 sm:text-base">
            Share a few details about what you&apos;re looking for and our team
            will follow up with tailored opportunities and next steps.
          </p>
        </div>
      </section>

      <section className="bg-slate-950/90">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] items-start">
            <form className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg shadow-slate-950/50 sm:p-6 lg:p-7">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-200">
                    Full name
                  </label>
                  <input
                    type="text"
                    placeholder="Your name"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-200">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-200">
                    Phone (optional)
                  </label>
                  <input
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-200">
                    Interest
                  </label>
                  <select className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40">
                    <option>Buying a home</option>
                    <option>Investment properties</option>
                    <option>Rentals</option>
                    <option>Portfolio review</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-200">
                  Location preference
                </label>
                <input
                  type="text"
                  placeholder="City, neighborhood, or region"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-200">
                  Approximate budget (USD)
                </label>
                <input
                  type="text"
                  placeholder="$500k – $1.2M"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-200">
                  How can we help?
                </label>
                <textarea
                  rows={4}
                  placeholder="Share a bit about your goals, timing, and what matters most to you."
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
                />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/40 transition hover:bg-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                >
                  Submit inquiry
                </button>
                <p className="text-[11px] text-slate-500">
                  We&apos;ll respond within one business day. No spam, ever.
                </p>
              </div>
            </form>

            <aside className="space-y-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-5 text-sm text-slate-200 shadow-lg shadow-slate-950/40 sm:p-6 lg:p-7">
              <h2 className="text-base font-semibold text-slate-50">
                What to expect
              </h2>
              <ul className="space-y-3 text-sm text-slate-300">
                <li>• A short discovery call to align on your goals.</li>
                <li>
                  • Curated properties that match your brief, not generic
                  listings.
                </li>
                <li>
                  • Clear financials, yield estimates, and risk considerations.
                </li>
                <li>• Ongoing support through negotiation and closing.</li>
              </ul>
              <div className="mt-4 border-t border-slate-800 pt-4 text-xs text-slate-400">
                Prefer email? Reach us at{" "}
                <span className="font-medium text-emerald-300">
                  hello@mashhour-investments.com
                </span>
                .
              </div>
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}

