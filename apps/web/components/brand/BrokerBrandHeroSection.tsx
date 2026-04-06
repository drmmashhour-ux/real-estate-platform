import Image from "next/image";
import Link from "next/link";

const highlights = [
  "Luxury black-and-gold broker identity",
  "AI-powered pricing, finance, and listing tools",
  "Phone-first real estate operating system direction",
] as const;

export function BrokerBrandHeroSection() {
  return (
    <section className="border-y border-slate-200 bg-[#0B0B0B] py-16 text-white">
      <div className="mx-auto max-w-6xl px-4">
        <div className="grid items-center gap-8 lg:grid-cols-[1.05fr,0.95fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-premium-gold">Flagship broker identity</p>
            <h2 className="mt-4 max-w-2xl text-4xl font-semibold tracking-tight">
              A premium real estate platform with a real broker face, a luxury brand, and stronger client trust.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-300">
              LECIPM is not only a property search site. It is becoming a broker-led operating system for listings, pricing,
              financing, legal workflow, and future mobile field tracking.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/broker/mohamed-al-mashhour"
                className="rounded-full bg-premium-gold px-6 py-3 text-sm font-semibold text-black transition hover:brightness-110"
              >
                Meet the broker
              </Link>
              <Link
                href="/professionals"
                className="rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-white transition hover:border-premium-gold/40 hover:bg-white/5"
              >
                Open professionals hub
              </Link>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {highlights.map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-300">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-3xl border border-premium-gold/25 bg-[radial-gradient(circle_at_top,#2a2108,transparent_34%),linear-gradient(180deg,#0c0c0c,#121212)] p-5">
              <div className="grid gap-4 md:grid-cols-[0.85fr,1.15fr]">
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/20">
                  <Image
                    src="/branding/mohamed-portrait.png"
                    alt="Mohamed Al Mashhour portrait"
                    width={900}
                    height={1200}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/20">
                  <Image
                    src="/branding/mohamed-broker-card.png"
                    alt="Mohamed Al Mashhour broker card"
                    width={1200}
                    height={900}
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/20">
              <Image
                src="/branding/mohamed-skyline.png"
                alt="Broker skyline platform visual"
                width={1200}
                height={900}
                className="h-auto w-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
