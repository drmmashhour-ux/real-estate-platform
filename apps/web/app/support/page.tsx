import Link from "next/link";

export default function SupportConsolePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <section className="border-b border-slate-800 bg-slate-950/80">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-sky-400">
            Support operations
          </p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
            Support console
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-400 sm:text-base">
            Ticket inbox, user and booking lookup, refunds, disputes, and escalation. For agents only.
          </p>
          <div className="mt-4 flex gap-3">
            <Link href="/admin" className="text-sm font-medium text-slate-400 hover:text-slate-300">
              ← Admin
            </Link>
          </div>
        </div>
      </section>
      <section className="bg-slate-950/90">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <nav className="mb-8 flex flex-wrap gap-2 border-b border-slate-800 pb-4">
            <span className="rounded-lg bg-sky-500/20 px-3 py-1.5 text-sm font-medium text-sky-300">Inbox</span>
            <a href="/support/lookup" className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200">User lookup</a>
            <a href="/support/booking-lookup" className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200">Booking lookup</a>
            <a href="/support/refunds" className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200">Refunds</a>
            <a href="/support/disputes" className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200">Disputes</a>
            <a href="/support/templates" className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200">Templates</a>
          </nav>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
            <h2 className="text-lg font-semibold text-slate-200">Ticket inbox</h2>
            <p className="mt-2 text-sm text-slate-500">Open tickets will appear here when the support ticket system is connected.</p>
            <div className="mt-4 rounded-lg border border-slate-700/60 p-4 text-center text-slate-500">
              No tickets yet. Use User lookup or Booking lookup to assist guests and hosts.
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
