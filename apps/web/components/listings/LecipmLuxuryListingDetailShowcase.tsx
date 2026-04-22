import Link from "next/link";
import type { LuxuryShowcaseProperty } from "@/components/listings/luxury-showcase-data";

function DetailStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-[#0D0D0D] p-4">
      <div className="text-[11px] uppercase tracking-[0.28em] text-[#D4AF37]/75">{label}</div>
      <div className="mt-2 text-lg font-medium text-white">{value}</div>
    </div>
  );
}

type Props = {
  base: string;
  property: LuxuryShowcaseProperty;
};

export function LecipmLuxuryListingDetailShowcase({ base, property }: Props) {
  return (
    <main className="min-h-screen bg-black text-white">
      <section className="mx-auto max-w-7xl px-6 py-8 lg:px-10">
        <div className="mb-6 flex items-center justify-between">
          <Link href={`${base}/listings`} className="text-sm text-[#D4AF37] transition hover:text-[#f1d37a]">
            ← Back to listings
          </Link>

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:border-[#D4AF37]/40 hover:text-[#D4AF37]"
            >
              Save
            </button>
            <button
              type="button"
              className="rounded-full border border-[#D4AF37]/60 bg-[#D4AF37] px-4 py-2 text-sm font-medium text-black hover:brightness-110"
            >
              Share
            </button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-4">
          <div
            className="min-h-[460px] rounded-[30px] border border-white/8 bg-cover bg-center lg:col-span-2"
            style={{ backgroundImage: `url(${property.images[0]})` }}
          />
          <div className="grid gap-4">
            <div
              className="min-h-[220px] rounded-[26px] border border-white/8 bg-cover bg-center"
              style={{ backgroundImage: `url(${property.images[1]})` }}
            />
            <div
              className="min-h-[220px] rounded-[26px] border border-white/8 bg-cover bg-center"
              style={{ backgroundImage: `url(${property.images[2]})` }}
            />
          </div>
          <div
            className="min-h-[460px] rounded-[30px] border border-white/8 bg-cover bg-center"
            style={{ backgroundImage: `url(${property.images[3]})` }}
          />
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-6 pb-16 pt-4 lg:grid-cols-[1.4fr_420px] lg:px-10">
        <div className="space-y-8">
          <div>
            <div className="text-[11px] uppercase tracking-[0.3em] text-[#D4AF37]/78">Exclusive listing</div>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white md:text-5xl">{property.title}</h1>
            <p className="mt-3 text-base text-white/60">{property.address}</p>
            <div className="mt-6 text-3xl font-semibold text-[#D4AF37]">{property.price}</div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <DetailStat label="Bedrooms" value={property.beds} />
            <DetailStat label="Bathrooms" value={property.baths} />
            <DetailStat label="Area" value={property.area} />
            <DetailStat label="Property type" value={property.type} />
          </div>

          <div className="rounded-[28px] border border-white/8 bg-[#0B0B0B] p-7">
            <h2 className="text-2xl font-medium text-white">Overview</h2>
            <p className="mt-4 text-sm leading-8 text-white/65">{property.description}</p>
          </div>

          <div className="rounded-[28px] border border-white/8 bg-[#0B0B0B] p-7">
            <h2 className="text-2xl font-medium text-white">Amenities</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {property.amenities.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-[#D4AF37]/14 bg-[#101010] px-4 py-3 text-sm text-white/75"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-[#D4AF37]/14 bg-[linear-gradient(135deg,#0D0D0D,#090909)] p-7">
            <div className="text-[11px] uppercase tracking-[0.3em] text-[#D4AF37]/78">AI insights</div>
            <h2 className="mt-3 text-2xl font-medium text-white">Intelligence layer</h2>
            <div className="mt-5 space-y-3">
              {property.aiInsights.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-4 text-sm text-white/70"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="h-fit rounded-[32px] border border-[#D4AF37]/16 bg-[linear-gradient(180deg,#0C0C0C,#090909)] p-7 shadow-[0_0_80px_rgba(212,175,55,0.08)] lg:sticky lg:top-8">
          <div className="text-[11px] uppercase tracking-[0.3em] text-[#D4AF37]/78">Private inquiry</div>
          <h2 className="mt-3 text-2xl font-medium text-white">Start your next step</h2>
          <p className="mt-3 text-sm leading-7 text-white/60">
            Connect with a broker, request a viewing, or save this opportunity for later.
          </p>

          <div className="mt-6 space-y-4">
            <button
              type="button"
              className="w-full rounded-full bg-[#D4AF37] px-5 py-3.5 text-sm font-medium text-black hover:brightness-110"
            >
              Contact broker
            </button>
            <button
              type="button"
              className="w-full rounded-full border border-[#D4AF37]/40 px-5 py-3.5 text-sm text-[#D4AF37] hover:bg-[#D4AF37]/10"
            >
              Book a visit
            </button>
            <button
              type="button"
              className="w-full rounded-full border border-white/10 bg-white/5 px-5 py-3.5 text-sm text-white/85 hover:border-[#D4AF37]/35 hover:text-[#D4AF37]"
            >
              Save listing
            </button>
          </div>

          <div className="mt-8 rounded-[24px] border border-white/8 bg-[#111111] p-5">
            <div className="text-[11px] uppercase tracking-[0.28em] text-[#D4AF37]/75">Investment snapshot</div>
            <div className="mt-4 space-y-3 text-sm text-white/70">
              <div className="flex items-center justify-between">
                <span>Market profile</span>
                <span className="text-[#D4AF37]">Premium</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Risk level</span>
                <span className="text-white">Low–Medium</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Long-term potential</span>
                <span className="text-white">Strong</span>
              </div>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}
