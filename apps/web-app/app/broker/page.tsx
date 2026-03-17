import Link from "next/link";

export default function BrokerCRMPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <section className="border-b border-slate-800 bg-slate-950/80">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
            Broker CRM
          </p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
            Licensed professional tools
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-400 sm:text-base">
            Manage clients, leads, listings, and communication. This module is planned; see the platform overview for the roadmap.
          </p>
          <div className="mt-4 flex gap-3">
            <Link href="/properties" className="text-sm font-medium text-emerald-400 hover:text-emerald-300">
              Browse properties →
            </Link>
            <Link href="/about-platform" className="text-sm font-medium text-slate-400 hover:text-slate-300">
              About platform →
            </Link>
          </div>
        </div>
      </section>
      <section className="bg-slate-950/90">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <nav className="mb-8 flex flex-wrap gap-2 border-b border-slate-800 pb-4">
            <span className="rounded-lg bg-emerald-500/20 px-3 py-1.5 text-sm font-medium text-emerald-300">Overview</span>
            <a href="/broker/clients" className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200">Clients</a>
            <a href="/broker/leads" className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200">Leads</a>
            <a href="/broker/listings" className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200">Listings</a>
            <a href="/broker/deals" className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200">Deals</a>
            <a href="/broker/analytics" className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200">Analytics</a>
          </nav>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Active clients</p>
              <p className="mt-1 text-2xl font-semibold text-slate-100">—</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Open leads</p>
              <p className="mt-1 text-2xl font-semibold text-slate-100">—</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Deals this month</p>
              <p className="mt-1 text-2xl font-semibold text-emerald-300">—</p>
            </div>
          </div>
          <p className="mt-6 text-sm text-slate-500">Connect your broker account to see clients, leads, and deal pipeline. Communication tools and notes available in each section.</p>
        </div>
      </section>
    </main>
  );
}
