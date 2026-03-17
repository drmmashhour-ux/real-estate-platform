export default function AdminDashboardPage() {
  return (
    <main className="bg-slate-950 text-slate-50">
      <section className="border-b border-slate-800 bg-slate-950/80">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-400">
            Admin
          </p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
            Dashboard
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-400 sm:text-base">
            Internal tools and platform alignment. Moderators and admins should
            operate in line with the platform mission and governance.
          </p>
        </div>
      </section>

      {/* Platform mission — internal alignment */}
      <section className="border-b border-slate-800 bg-slate-950/90">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <h2 className="text-lg font-semibold text-slate-50 sm:text-xl">
            Platform mission (internal reference)
          </h2>
          <p className="mt-2 text-xs text-slate-500">
            Single source of truth:{" "}
            <code className="rounded bg-slate-800 px-1.5 py-0.5 text-slate-400">
              docs/PLATFORM-MISSION.md
            </code>
          </p>
          <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900/60 p-5 text-sm">
            <p className="font-medium text-emerald-300">Mission</p>
            <p className="mt-2 text-slate-300">
              To connect people, licensed professionals, and investors in a
              trusted and verified digital ecosystem—enabling confident property
              discovery, professional guidance, and long-term value through
              relationship-driven real estate and lifestyle services.
            </p>
            <p className="mt-4 font-medium text-emerald-300">Vision</p>
            <p className="mt-2 text-slate-300">
              A world where every property search, investment decision, and
              professional interaction happens inside a transparent, safe, and
              relationship-oriented platform—where verification and reputation
              replace uncertainty.
            </p>
            <p className="mt-4 font-medium text-emerald-300">Core values</p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-slate-300">
              <li>Trust first — Verification and transparency before scale.</li>
              <li>
                Relationships over transactions — Long-term professional and
                user relationships matter.
              </li>
              <li>
                Clear rules — Participation, conduct, and disputes governed by
                published standards.
              </li>
              <li>
                Ecosystem alignment — Success for users, professionals, owners,
                and investors together.
              </li>
            </ul>
          </div>
          <p className="mt-4 text-xs text-slate-500">
            Use this mission when making moderation decisions, designing
            features, or resolving disputes. Governance rules:{" "}
            <code className="rounded bg-slate-800 px-1.5 py-0.5 text-slate-400">
              docs/PLATFORM-GOVERNANCE.md
            </code>
          </p>
          <div className="mt-4 flex gap-3">
            <a
              href="/about-platform"
              className="text-sm font-medium text-emerald-400 hover:text-emerald-300"
            >
              View public About platform →
            </a>
          </div>
        </div>
      </section>

      {/* Admin tools */}
      <section className="bg-slate-950/80">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <h2 className="text-lg font-semibold text-slate-50 sm:text-xl">
            Tools
          </h2>
          <nav className="mt-4 flex flex-wrap gap-2">
            <a href="/admin/users" className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200">Users</a>
            <a href="/admin/controls" className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200">Operational controls</a>
            <a href="/admin/health" className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200">Platform health</a>
            <a href="/admin/policies" className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200">Policy engine</a>
            <a href="/admin/moderation" className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200">Verification queue</a>
            <a href="/admin/verifications" className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200">Ownership verification</a>
            <a href="/admin/listings" className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200">Listing moderation</a>
            <a href="/admin/bookings" className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200">Bookings</a>
            <a href="/admin/transactions" className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200">Transactions</a>
            <a href="/admin/incidents" className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200">Incidents</a>
            <a href="/admin/disputes" className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200">Dispute resolution</a>
            <a href="/admin/payouts" className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200">Payout holds</a>
            <a href="/admin/trust-safety" className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200">Trust & safety</a>
            <a href="/admin/fraud" className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200">Fraud alerts</a>
            <a href="/admin/property-identities" className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200">Property Identity Console</a>
            <a href="/admin/valuation" className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200">AVM Valuation</a>
            <a href="/admin/ranking" className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200">Ranking config</a>
            <a href="/admin/supply-growth" className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200">Supply growth</a>
            <a href="/admin/revenue" className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200">Revenue</a>
            <a href="/admin/subscriptions" className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200">Subscriptions</a>
            <a href="/admin/promotions" className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200">Promotions</a>
            <a href="/admin/markets" className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200">Markets</a>
            <a href="/admin/growth" className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200">Growth campaigns</a>
            <a href="/admin/executive" className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200">Executive dashboard</a>
            <a href="/admin/ai" className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200">AI Control Center</a>
            <a href="/admin/defense" className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200">Platform Defense</a>
            <a href="/admin/audit" className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200">Audit logs</a>
            <a href="/admin/metrics" className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200">System metrics</a>
          </nav>
          <p className="mt-4 text-sm text-slate-500">
            Ensure all actions align with platform mission and governance (
            <code className="rounded bg-slate-800 px-1 py-0.5 text-slate-400">
              docs/PLATFORM-GOVERNANCE.md
            </code>
            ).
          </p>
        </div>
      </section>
    </main>
  );
}
