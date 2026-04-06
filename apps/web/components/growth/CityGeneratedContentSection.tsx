import type { CityIntentKind } from "@/lib/growth/city-intent-seo";
import { generateCityContent } from "@/lib/growth/generate-city-content";

const GOLD = "var(--color-premium-gold)";

/** Intro + trust/value + market blurb + highlights + tips from {@link generateCityContent}. */
export function CityGeneratedContentSection({ city, category }: { city: string; category?: CityIntentKind }) {
  const { intro, trustValue, locationMarket, highlights, tips } = generateCityContent(city, category);
  return (
    <section className="border-t border-white/10 bg-[#080808] py-12">
      <div className="mx-auto max-w-6xl px-4">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/45">About this market</p>
        <h2 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">Explore {city}</h2>
        <p className="mt-4 max-w-3xl text-base leading-relaxed text-white/78">{intro}</p>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
            <h3 className="text-sm font-semibold uppercase tracking-wide" style={{ color: GOLD }}>
              Trust &amp; value on LECIPM
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-white/78">{trustValue}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
            <h3 className="text-sm font-semibold uppercase tracking-wide" style={{ color: GOLD }}>
              Finding listings in {city}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-white/78">{locationMarket}</p>
          </div>
        </div>
        <div className="mt-10 grid gap-8 md:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide" style={{ color: GOLD }}>
              Highlights
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-white/80">
              {highlights.map((h) => (
                <li key={h} className="flex gap-2">
                  <span className="text-premium-gold" aria-hidden>
                    ·
                  </span>
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide" style={{ color: GOLD }}>
              Tips
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-white/80">
              {tips.map((t) => (
                <li key={t} className="flex gap-2">
                  <span className="text-premium-gold" aria-hidden>
                    ·
                  </span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
