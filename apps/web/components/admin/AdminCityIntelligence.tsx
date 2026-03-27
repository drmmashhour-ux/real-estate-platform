import Link from "next/link";
import { getCityIntelligenceAdminSummary } from "@/lib/admin/city-intelligence-admin";

function labelSlug(slug: string) {
  return slug.charAt(0).toUpperCase() + slug.slice(1);
}

export async function AdminCityIntelligence() {
  const s = await getCityIntelligenceAdminSummary();

  return (
    <section
      className="rounded-2xl border border-[#C9A646]/25 bg-[#0B0B0B]/80 p-6 shadow-lg shadow-black/20"
      aria-labelledby="admin-city-intel-heading"
    >
      <h2 id="admin-city-intel-heading" className="text-sm font-semibold uppercase tracking-wider text-[#C9A646]">
        City intelligence
      </h2>
      <p className="mt-2 text-xs text-[#B3B3B3]">
        Recent booking sample (Montreal / Laval / Quebec buckets). Revenue = sum of guest totals in sample.
      </p>
      <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <dt className="text-xs text-slate-500">Top city by revenue</dt>
          <dd className="mt-1 text-lg font-semibold text-white">
            {s.topCityByRevenue ? (
              <Link href={`/city/${s.topCityByRevenue}`} className="hover:text-[#C9A646]">
                {labelSlug(s.topCityByRevenue)}
              </Link>
            ) : (
              "—"
            )}
          </dd>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <dt className="text-xs text-slate-500">Top city by bookings</dt>
          <dd className="mt-1 text-lg font-semibold text-white">
            {s.topCityByVolume ? (
              <Link href={`/city/${s.topCityByVolume}`} className="hover:text-[#C9A646]">
                {labelSlug(s.topCityByVolume)}
              </Link>
            ) : (
              "—"
            )}
          </dd>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <dt className="text-xs text-slate-500">Highest avg nights / booking</dt>
          <dd className="mt-1 text-lg font-semibold text-white">
            {s.topCityByBookingIntensity ? (
              <Link href={`/city/${s.topCityByBookingIntensity}`} className="hover:text-[#C9A646]">
                {labelSlug(s.topCityByBookingIntensity)}
              </Link>
            ) : (
              "—"
            )}
          </dd>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <dt className="text-xs text-slate-500">Best investment score</dt>
          <dd className="mt-1 text-lg font-semibold text-white">
            {s.topCityByInvestmentScore ? (
              <Link href={`/city/${s.topCityByInvestmentScore}`} className="hover:text-[#C9A646]">
                {labelSlug(s.topCityByInvestmentScore)}
              </Link>
            ) : (
              "—"
            )}
          </dd>
        </div>
      </dl>
      <ul className="mt-6 divide-y divide-white/10 rounded-xl border border-white/10 text-xs text-[#B3B3B3]">
        {s.cities.map((c) => (
          <li key={c.slug} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
            <Link href={`/city/${c.slug}`} className="font-medium text-white hover:text-[#C9A646]">
              {labelSlug(c.slug)}
            </Link>
            <span>
              ${(c.revenueCents / 100).toLocaleString()} · {c.bookingCount} bookings · score {c.investmentScore}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
