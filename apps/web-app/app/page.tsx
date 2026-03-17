import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-slate-950/70 to-slate-900/40 z-10" />
          <div
            className="h-full w-full bg-cover bg-center scale-105"
            style={{
              backgroundImage:
                "url('https://images.pexels.com/photos/259588/pexels-photo-259588.jpeg?auto=compress&cs=tinysrgb&w=1600')",
            }}
          />
        </div>

        <div className="relative z-20">
          <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 py-20 sm:px-6 md:flex-row md:items-center md:py-28 lg:px-8 lg:py-32">
            <div className="max-w-xl">
              <p className="mb-4 inline-flex items-center rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium uppercase tracking-wide text-emerald-300 ring-1 ring-emerald-500/40">
                Premium Real Estate Platform
              </p>
              <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
                <span className="block text-slate-50">
                  Find Your Dream Property
                </span>
                <span className="mt-2 block text-slate-300 text-xl sm:text-2xl font-normal">
                  Curated homes, investments, and rentals in top locations.
                </span>
              </h1>

              <p className="mt-6 text-base text-slate-300 sm:text-lg">
                Mashhour Investments is a relationship-driven real estate and
                lifestyle platform connecting people, licensed professionals,
                and investors within a trusted and verified digital ecosystem.
              </p>
              <p className="mt-3 text-sm text-slate-400 sm:text-base">
                Discover hand‑picked properties with transparent insights, rich
                media, and expert guidance—designed to make your next move
                simple, confident, and rewarding.
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
                <Link
                  href="/properties"
                  className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                >
                  Browse Properties
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center rounded-full border border-slate-700 bg-slate-900/40 px-6 py-3 text-sm font-semibold text-slate-100 backdrop-blur transition hover:border-slate-500 hover:bg-slate-900/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                >
                  Contact Us
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap gap-4 text-xs text-slate-400 sm:text-sm">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  Trusted by investors & families
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  Curated properties in prime locations
                </div>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/60 p-5 shadow-2xl shadow-slate-950/60 backdrop-blur sm:p-6 lg:max-w-sm">
              <div className="mb-4 flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-slate-100">
                  Quick Property Search
                </h2>
                <span className="rounded-full bg-slate-800 px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-slate-300">
                  Live Market
                </span>
              </div>
              <form className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-300">
                    Location
                  </label>
                  <input
                    type="text"
                    placeholder="City, neighborhood, or ZIP"
                    className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-300">
                      Min. budget
                    </label>
                    <input
                      type="number"
                      placeholder="$250k"
                      className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-300">
                      Property type
                    </label>
                    <select className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2.5 text-sm text-slate-100 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40">
                      <option>Any</option>
                      <option>Residential</option>
                      <option>Investment</option>
                      <option>Rental</option>
                    </select>
                  </div>
                </div>
                <button
                  type="submit"
                  className="flex w-full items-center justify-center rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/40 transition hover:bg-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                >
                  Start Searching
                </button>
              </form>

              <div className="mt-4 flex items-center justify-between text-[11px] text-slate-400">
                <span>Avg. viewing scheduled in &lt; 24h</span>
                <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-emerald-300">
                  New listings today
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Properties */}
      <section className="border-t border-slate-800 bg-slate-950/80">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end sm:gap-6">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-50 sm:text-3xl">
                Featured Properties
              </h2>
              <p className="mt-2 max-w-xl text-sm text-slate-400 sm:text-base">
                Explore a curated selection of top‑performing homes and
                investments available right now.
              </p>
            </div>
            <Link
              href="/properties"
              className="inline-flex text-sm font-semibold text-emerald-400 hover:text-emerald-300"
            >
              View all properties
            </Link>
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Property Card 1 */}
            <article className="group flex flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 shadow-lg shadow-slate-950/40 transition hover:-translate-y-1 hover:border-emerald-400/70 hover:shadow-emerald-500/20">
              <div className="relative h-52 overflow-hidden">
                <div
                  className="h-full w-full bg-cover bg-center transition duration-700 group-hover:scale-105"
                  style={{
                    backgroundImage:
                      "url('https://images.pexels.com/photos/259588/pexels-photo-259588.jpeg?auto=compress&cs=tinysrgb&w=1200')",
                  }}
                />
                <span className="absolute left-3 top-3 rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-slate-950">
                  New
                </span>
              </div>
              <div className="flex flex-1 flex-col p-4 sm:p-5">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-slate-50 sm:text-base">
                    Waterfront Villa, Palm District
                  </h3>
                  <span className="text-xs font-semibold text-emerald-300 sm:text-sm">
                    $1.2M
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-400 sm:text-sm">
                  4 beds • 3.5 baths • 3,200 sqft
                </p>
                <p className="mt-3 line-clamp-2 text-xs text-slate-400 sm:text-sm">
                  Sun‑drenched modern villa with private dock, infinity pool,
                  and panoramic skyline views.
                </p>
                <div className="mt-4 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Yield est. 7.4% / yr</span>
                  <span>Listed 2 days ago</span>
                </div>
              </div>
            </article>

            {/* Property Card 2 */}
            <article className="group flex flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 shadow-lg shadow-slate-950/40 transition hover:-translate-y-1 hover:border-emerald-400/70 hover:shadow-emerald-500/20">
              <div className="relative h-52 overflow-hidden">
                <div
                  className="h-full w-full bg-cover bg-center transition duration-700 group-hover:scale-105"
                  style={{
                    backgroundImage:
                      "url('https://images.pexels.com/photos/439391/pexels-photo-439391.jpeg?auto=compress&cs=tinysrgb&w=1200')",
                  }}
                />
                <span className="absolute left-3 top-3 rounded-full bg-slate-900/90 px-3 py-1 text-xs font-semibold text-slate-100">
                  Featured
                </span>
              </div>
              <div className="flex flex-1 flex-col p-4 sm:p-5">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-slate-50 sm:text-base">
                    City Center Investment Loft
                  </h3>
                  <span className="text-xs font-semibold text-emerald-300 sm:text-sm">
                    $680k
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-400 sm:text-sm">
                  2 beds • 2 baths • 1,150 sqft
                </p>
                <p className="mt-3 line-clamp-2 text-xs text-slate-400 sm:text-sm">
                  High‑demand rental in the financial district with premium
                  finishes and amenity‑rich building.
                </p>
                <div className="mt-4 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Occupancy 96% last 12 mo</span>
                  <span>Cap rate 6.1%</span>
                </div>
              </div>
            </article>

            {/* Property Card 3 */}
            <article className="group flex flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 shadow-lg shadow-slate-950/40 transition hover:-translate-y-1 hover:border-emerald-400/70 hover:shadow-emerald-500/20">
              <div className="relative h-52 overflow-hidden">
                <div
                  className="h-full w-full bg-cover bg-center transition duration-700 group-hover:scale-105"
                  style={{
                    backgroundImage:
                      "url('https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=1200')",
                  }}
                />
                <span className="absolute left-3 top-3 rounded-full bg-emerald-500/90 px-3 py-1 text-xs font-semibold text-slate-950">
                  High Yield
                </span>
              </div>
              <div className="flex flex-1 flex-col p-4 sm:p-5">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-slate-50 sm:text-base">
                    Boutique Rental Portfolio (3 units)
                  </h3>
                  <span className="text-xs font-semibold text-emerald-300 sm:text-sm">
                    $920k
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-400 sm:text-sm">
                  6 beds • 5 baths • 4,000 sqft total
                </p>
                <p className="mt-3 line-clamp-2 text-xs text-slate-400 sm:text-sm">
                  Renovated multi‑family units in a growing corridor with
                  strong rental history and upside potential.
                </p>
                <div className="mt-4 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Gross yield 8.3%</span>
                  <span>Stabilized & cash‑flowing</span>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>
    </main>
  );
}