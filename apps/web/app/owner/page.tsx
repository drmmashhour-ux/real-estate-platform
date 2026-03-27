import Link from "next/link";

export default function OwnerDashboardPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <section className="border-b border-slate-800 bg-slate-950/80">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
            Owner dashboard
          </p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
            Property owner dashboard
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-400 sm:text-base">
            Manage listings, bookings, and revenue. For short-term rentals use the BNHub host dashboard.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/bnhub/host/dashboard" className="text-sm font-medium text-emerald-400 hover:text-emerald-300">
              BNHub host dashboard →
            </Link>
            <Link href="/tools/design-studio" className="text-sm font-medium text-amber-400 hover:text-amber-300">
              Design Studio →
            </Link>
            <Link href="/projects" className="text-sm font-medium text-slate-400 hover:text-slate-300">
              Properties →
            </Link>
          </div>
          <p className="mt-2 text-xs text-slate-500">Design Studio: create marketing visuals in your own Canva page; save designs to your listing dashboard.</p>
        </div>
      </section>
      <section className="bg-slate-950/90">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <nav className="mb-8 flex flex-wrap gap-2 border-b border-slate-800 pb-4">
            <span className="rounded-lg bg-emerald-500/20 px-3 py-1.5 text-sm font-medium text-emerald-300">Portfolio</span>
            <a href="/owner/performance" className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200">Performance</a>
            <a href="/owner/revenue" className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200">Revenue</a>
            <a href="/owner/maintenance" className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200">Maintenance</a>
            <a href="/owner/payouts" className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200">Payouts</a>
          </nav>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Properties</p>
              <p className="mt-1 text-2xl font-semibold text-slate-100">—</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Occupancy (30d)</p>
              <p className="mt-1 text-2xl font-semibold text-slate-100">—</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Revenue (30d)</p>
              <p className="mt-1 text-2xl font-semibold text-emerald-300">—</p>
            </div>
          </div>
          <p className="mt-6 text-sm text-slate-500">For short-term rentals use the <Link href="/bnhub/host/dashboard" className="text-emerald-400 hover:text-emerald-300">BNHub host dashboard</Link>. This view aggregates portfolio-wide analytics when connected.</p>
        </div>
      </section>
    </main>
  );
}
