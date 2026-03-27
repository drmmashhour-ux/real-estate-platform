import Link from "next/link";

export default function BNHubPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      {/* Top bar */}
      <header className="border-b border-slate-800/80 bg-slate-950/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href="/bnhub"
            className="text-lg font-semibold tracking-tight text-white"
          >
            BNB Hub
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/bnhub/stays"
              className="text-sm font-medium text-slate-300 hover:text-white"
            >
              Find a stay
            </Link>
            <Link
              href="/bnhub/host/dashboard"
              className="text-sm font-medium text-slate-300 hover:text-white"
            >
              Host dashboard
            </Link>
            <Link
              href="/bnhub/login"
              className="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100"
            >
              Sign in
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-slate-800">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/40 via-slate-950 to-slate-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(16,185,129,0.15),transparent)]" />
        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
            Short-term rentals
          </p>
          <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Find a place to stay, or share your space
          </h1>
          <p className="mt-4 max-w-xl text-base text-slate-400 sm:text-lg">
            Verified short-term rentals connected to the real-estate ecosystem. Search by location and dates, or list your property.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/bnhub/stays"
              className="group flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3.5 text-base font-semibold text-slate-950 shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-400 hover:shadow-emerald-500/30"
            >
              Find a stay
              <span className="text-slate-700 group-hover:translate-x-0.5">→</span>
            </Link>
            <Link
              href="/bnhub/host/dashboard"
              className="flex items-center gap-2 rounded-xl border border-slate-600 bg-slate-800/60 px-6 py-3.5 text-base font-semibold text-white transition hover:border-slate-500 hover:bg-slate-800"
            >
              List your property
            </Link>
          </div>
        </div>
      </section>

      {/* Two-column value */}
      <section className="border-b border-slate-800 bg-slate-900/30">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-12 md:grid-cols-2">
            <div>
              <h2 className="text-lg font-semibold text-white">For guests</h2>
              <p className="mt-2 text-slate-400">
                Search verified short-term rentals by city and dates. Compare prices, read reviews, and book with confidence.
              </p>
              <Link
                href="/bnhub/stays"
                className="mt-4 inline-block text-sm font-medium text-emerald-400 hover:text-emerald-300"
              >
                Browse stays →
              </Link>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">For hosts</h2>
              <p className="mt-2 text-slate-400">
                Manage listings, calendar, bookings, and earnings in one dashboard. Use pricing tools and insights to maximize revenue.
              </p>
              <Link
                href="/bnhub/host/dashboard"
                className="mt-4 inline-block text-sm font-medium text-emerald-400 hover:text-emerald-300"
              >
                Open host dashboard →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer links */}
      <footer className="bg-slate-950 py-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <span className="text-sm text-slate-500">BNB Hub · Short-term rentals</span>
            <div className="flex gap-6">
              <Link href="/bnhub/stays" className="text-sm text-slate-400 hover:text-slate-300">
                Find a stay
              </Link>
              <Link href="/bnhub/host/dashboard" className="text-sm text-slate-400 hover:text-slate-300">
                Host dashboard
              </Link>
              <Link href="/bnhub/trips" className="text-sm text-slate-400 hover:text-slate-300">
                My trips
              </Link>
              <Link href="/bnhub/login" className="text-sm text-slate-400 hover:text-slate-300">
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
