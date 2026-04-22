import Link from "next/link";
import type { LuxuryBnhubStayShowcase } from "@/components/bnhub/bnhub-luxury-stay-showcase-data";

function InfoPill({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-[#0E0E0E] px-4 py-4">
      <div className="text-[11px] uppercase tracking-[0.28em] text-[#D4AF37]/75">{label}</div>
      <div className="mt-2 text-base font-medium text-white">{value}</div>
    </div>
  );
}

type Props = {
  base: string;
  stay: LuxuryBnhubStayShowcase;
};

export function BnhubLuxuryStayDetailShowcase({ base, stay }: Props) {
  return (
    <main className="min-h-screen bg-black text-white">
      <section className="mx-auto max-w-7xl px-6 py-8 lg:px-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <Link href={`${base}/bnhub/stays`} className="text-sm text-[#D4AF37] hover:text-[#f1d37a]">
              ← Back to BNHub
            </Link>
            <Link href={`${base}/bnhub/stays?view=luxury`} className="text-xs text-white/45 underline-offset-4 hover:text-white/70">
              Luxury grid
            </Link>
          </div>
          <button
            type="button"
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:border-[#D4AF37]/35 hover:text-[#D4AF37]"
          >
            Save stay
          </button>
        </div>

        <div className="grid gap-4 lg:grid-cols-4">
          <div
            className="min-h-[460px] rounded-[30px] border border-white/8 bg-cover bg-center lg:col-span-2"
            style={{ backgroundImage: `url(${stay.images[0]})` }}
          />
          <div className="grid gap-4">
            <div
              className="min-h-[220px] rounded-[26px] border border-white/8 bg-cover bg-center"
              style={{ backgroundImage: `url(${stay.images[1]})` }}
            />
            <div
              className="min-h-[220px] rounded-[26px] border border-white/8 bg-cover bg-center"
              style={{ backgroundImage: `url(${stay.images[2]})` }}
            />
          </div>
          <div
            className="min-h-[460px] rounded-[30px] border border-white/8 bg-cover bg-center"
            style={{ backgroundImage: `url(${stay.images[3]})` }}
          />
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-6 pb-16 pt-4 lg:grid-cols-[1.4fr_420px] lg:px-10">
        <div className="space-y-8">
          <div>
            <div className="text-[11px] uppercase tracking-[0.3em] text-[#D4AF37]/78">Signature stay</div>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white md:text-5xl">{stay.title}</h1>
            <p className="mt-3 text-base text-white/60">{stay.location}</p>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-white/65">
              <span className="text-[#D4AF37]">★ {stay.rating}</span>
              <span>{stay.guests} guests</span>
              <span>{stay.beds} beds</span>
              <span>{stay.baths} baths</span>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <InfoPill label="Guests" value={stay.guests} />
            <InfoPill label="Beds" value={stay.beds} />
            <InfoPill label="Baths" value={stay.baths} />
          </div>

          <div className="rounded-[28px] border border-white/8 bg-[#0B0B0B] p-7">
            <h2 className="text-2xl font-medium text-white">About this stay</h2>
            <p className="mt-4 text-sm leading-8 text-white/65">{stay.description}</p>
          </div>

          <div className="rounded-[28px] border border-white/8 bg-[#0B0B0B] p-7">
            <h2 className="text-2xl font-medium text-white">Amenities</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {stay.amenities.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-[#D4AF37]/14 bg-[#101010] px-4 py-3 text-sm text-white/75"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="h-fit rounded-[32px] border border-[#D4AF37]/16 bg-[linear-gradient(180deg,#0C0C0C,#090909)] p-7 shadow-[0_0_80px_rgba(212,175,55,0.08)] lg:sticky lg:top-8">
          <div className="text-[11px] uppercase tracking-[0.3em] text-[#D4AF37]/78">Reserve</div>
          <div className="mt-3 text-3xl font-semibold text-[#D4AF37]">{stay.price}</div>
          <p className="mt-2 text-sm text-white/60">Experience premium short-term stays with elegant simplicity.</p>

          <div className="mt-6 space-y-3">
            <input
              placeholder="Check-in"
              type="text"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/35 focus:border-[#D4AF37]/40 focus:outline-none"
            />
            <input
              placeholder="Check-out"
              type="text"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/35 focus:border-[#D4AF37]/40 focus:outline-none"
            />
            <input
              placeholder="Guests"
              type="text"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/35 focus:border-[#D4AF37]/40 focus:outline-none"
            />
          </div>

          <button
            type="button"
            className="mt-6 w-full rounded-full bg-[#D4AF37] px-5 py-3.5 text-sm font-medium text-black hover:brightness-110"
          >
            Reserve now
          </button>

          <p className="mt-3 text-center text-[11px] text-white/40">Demo UI — does not process payment.</p>

          <div className="mt-8 rounded-[24px] border border-white/8 bg-[#111111] p-5 text-sm text-white/70">
            <div className="flex items-center justify-between">
              <span>Nightly rate</span>
              <span>{stay.price}</span>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span>Service</span>
              <span>{stay.serviceFeeDisplay}</span>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-white/8 pt-3 font-medium text-white">
              <span>Total (example)</span>
              <span>{stay.totalDemoDisplay}</span>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}
