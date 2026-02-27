export default function PropertiesPage() {
  const properties = [
    {
      id: 1,
      title: "Waterfront Villa, Palm District",
      price: "$1.2M",
      meta: "4 beds • 3.5 baths • 3,200 sqft",
      badge: "New",
      tagColor: "bg-emerald-500 text-slate-950",
      image:
        "https://images.pexels.com/photos/259588/pexels-photo-259588.jpeg?auto=compress&cs=tinysrgb&w=1200",
      highlight: "Prime coastal neighborhood • Private dock • Infinity pool",
    },
    {
      id: 2,
      title: "City Center Investment Loft",
      price: "$680k",
      meta: "2 beds • 2 baths • 1,150 sqft",
      badge: "Featured",
      tagColor: "bg-slate-900/90 text-slate-100",
      image:
        "https://images.pexels.com/photos/439391/pexels-photo-439391.jpeg?auto=compress&cs=tinysrgb&w=1200",
      highlight: "Financial district • High rental demand • Concierge building",
    },
    {
      id: 3,
      title: "Boutique Rental Portfolio (3 units)",
      price: "$920k",
      meta: "6 beds • 5 baths • 4,000 sqft total",
      badge: "High Yield",
      tagColor: "bg-emerald-500/90 text-slate-950",
      image:
        "https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=1200",
      highlight:
        "Stabilized multi‑family • Strong cash flow • Growth corridor",
    },
    {
      id: 4,
      title: "Suburban Family Home, Green Oaks",
      price: "$540k",
      meta: "3 beds • 2.5 baths • 2,100 sqft",
      badge: "Family",
      tagColor: "bg-slate-800 text-slate-100",
      image:
        "https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=1200",
      highlight: "Quiet cul‑de‑sac • Top‑rated schools • Private backyard",
    },
    {
      id: 5,
      title: "Luxury Penthouse, Skyline Tower",
      price: "$1.8M",
      meta: "3 beds • 3 baths • 2,400 sqft",
      badge: "Luxury",
      tagColor: "bg-purple-500 text-slate-50",
      image:
        "https://images.pexels.com/photos/439391/pexels-photo-439391.jpeg?auto=compress&cs=tinysrgb&w=1200",
      highlight:
        "Panoramic city views • Private terrace • Residents’ lounge",
    },
    {
      id: 6,
      title: "Modern Studio, Arts District",
      price: "$290k",
      meta: "1 bed • 1 bath • 650 sqft",
      badge: "Starter",
      tagColor: "bg-slate-800 text-slate-100",
      image:
        "https://images.pexels.com/photos/439391/pexels-photo-439391.jpeg?auto=compress&cs=tinysrgb&w=1200",
      highlight: "Walkable location • Creative hub • Ideal first investment",
    },
  ];

  return (
    <main className="bg-slate-950 text-slate-50">
      <section className="border-b border-slate-800 bg-slate-950/80">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
            Properties
          </p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
            Explore curated opportunities
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-400 sm:text-base">
            Browse a selection of vetted homes, investments, and rentals
            designed to balance lifestyle and long‑term performance.
          </p>
        </div>
      </section>

      <section className="bg-slate-950/90">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {properties.map((property) => (
              <article
                key={property.id}
                className="group flex flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 shadow-lg shadow-slate-950/40 transition hover:-translate-y-1 hover:border-emerald-400/70 hover:shadow-emerald-500/20"
              >
                <div className="relative h-52 overflow-hidden">
                  <div
                    className="h-full w-full bg-cover bg-center transition duration-700 group-hover:scale-105"
                    style={{
                      backgroundImage: `url('${property.image}')`,
                    }}
                  />
                  <span
                    className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-semibold ${property.tagColor}`}
                  >
                    {property.badge}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-4 sm:p-5">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-sm font-semibold text-slate-50 sm:text-base">
                      {property.title}
                    </h2>
                    <span className="text-xs font-semibold text-emerald-300 sm:text-sm">
                      {property.price}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-400 sm:text-sm">
                    {property.meta}
                  </p>
                  <p className="mt-3 line-clamp-2 text-xs text-slate-400 sm:text-sm">
                    {property.highlight}
                  </p>
                  <div className="mt-4 flex items-center justify-between text-[11px] text-slate-400">
                    <span>More details coming soon</span>
                    <button className="rounded-full bg-slate-800 px-3 py-1 text-[11px] font-semibold text-slate-100 transition group-hover:bg-emerald-500 group-hover:text-slate-950">
                      View details
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

