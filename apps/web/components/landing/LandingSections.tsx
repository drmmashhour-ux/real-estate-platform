import Image from "next/image";
import Link from "next/link";

type Props = { basePath: string };

const sectionY = "px-4 py-24 md:py-32";

const cardCls =
  "rounded-2xl border border-neutral-800 bg-gradient-to-b from-neutral-900 to-black p-8 shadow-sm transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 hover:border-[#C9A96A] hover:shadow-[0_0_40px_rgba(201,169,106,0.12)]";

const ctaBtn =
  "mt-8 inline-flex min-h-[56px] items-center justify-center rounded-2xl bg-[#C9A96A] px-10 py-5 font-semibold text-black shadow-[0_0_30px_rgba(201,169,106,0.4)] transition duration-300 hover:bg-[#E5C07B] hover:shadow-[0_0_40px_rgba(201,169,106,0.6)]";

export function LandingSections({ basePath }: Props) {
  return (
    <section className="relative z-10 pt-24">
      <section className={`border-y border-neutral-800 bg-black ${sectionY}`}>
        <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-2 md:items-center md:gap-16">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">Precision</p>
            <h2 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-white md:text-4xl">
              Analyze smarter
            </h2>
            <p className="mt-4 text-neutral-300 md:text-lg">
              Compare opportunities with broker-grade dashboards. Clear signals—not noise—for Québec markets you actually work.
            </p>
            <Link
              href={`${basePath}/analyze`}
              className="mt-8 inline-flex min-h-[48px] items-center rounded-2xl border border-neutral-700 px-6 py-3 text-sm font-semibold text-white transition hover:border-neutral-600 hover:bg-white/[0.04]"
            >
              Open analyze
            </Link>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-neutral-800">
            <Image
              src="https://images.unsplash.com/photo-1560520653-e728ebbf78f26?auto=format&fit=crop&w=1400&q=75"
              alt=""
              fill
              className="object-cover"
              sizes="(min-width: 768px) 50vw, 100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-black/60 via-transparent to-black/40" aria-hidden />
          </div>
        </div>
      </section>

      <section className={`bg-[#070707] ${sectionY}`}>
        <div className="mx-auto max-w-6xl text-center md:text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">Selection</p>
          <h2 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-white md:text-4xl">
            Find better properties
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-neutral-300 md:mx-0 md:text-lg">
            Curated search, transparent context, and a flow that respects how serious buyers browse.
          </p>
        </div>
        <div className="mx-auto mt-14 grid max-w-6xl gap-6 md:grid-cols-3 md:gap-8">
          {(
            [
              {
                title: "Signal-first discovery",
                body: "Surface listings that align with criteria you care about—from location to readiness to transact.",
              },
              {
                title: "Clarity before contact",
                body: "Understand the story of the home with structured highlights and trustworthy presentation.",
              },
              {
                title: "Momentum that fits you",
                body: "Stay organized from first glance to informed next step—without the noise of generic portals.",
              },
            ] as const
          ).map((c) => (
            <article key={c.title} className={cardCls}>
              <h3 className="text-lg font-semibold text-white">{c.title}</h3>
              <p className="mt-4 text-sm leading-relaxed text-neutral-400">{c.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={`border-t border-neutral-800 bg-black ${sectionY}`}>
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">Trust</p>
          <h2 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-white md:text-4xl">
            Invest with confidence
          </h2>
          <p className="mt-4 text-neutral-300 md:text-lg">
            Built with Québec-real-estate workflows in mind: privacy-aware patterns, disciplined product architecture, and an
            experience tuned for discerning clients—not algorithmic overwhelm.
          </p>
          <div className="mx-auto mt-10 max-w-xl rounded-2xl border border-neutral-800 bg-gradient-to-b from-neutral-900/90 to-black p-8 text-center text-sm">
            <p className="font-medium text-white">Security & reliability</p>
            <p className="mt-3 leading-relaxed text-neutral-400">
              We prioritize safe defaults, transparent flows, and a platform stance aligned with regulated markets.
              Always verify critical details with your licensed advisor.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-[#070707] px-4 py-28 text-center">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-4xl font-semibold text-white">Start your real estate journey today</h2>
          <p className="mt-4 text-neutral-400">Built for investors, brokers, and modern buyers.</p>
          <Link href={`${basePath}/listings`} className={ctaBtn}>
            Explore properties
          </Link>
        </div>
      </section>
    </section>
  );
}

export default LandingSections;
