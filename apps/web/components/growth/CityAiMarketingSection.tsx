import type { CityIntentKind } from "@/lib/growth/city-intent-seo";
import { getCityAiMarketingCopy } from "@/lib/marketplace-engine/ai-city-marketing";

const GOLD = "var(--color-premium-gold)";

export async function CityAiMarketingSection({
  slug,
  intent,
  city,
  inventoryCount,
}: {
  slug: string;
  intent: CityIntentKind;
  city: string;
  inventoryCount: number;
}) {
  const copy = await getCityAiMarketingCopy({ slug, intent, city, inventoryCount });
  if (!copy.enabled) return null;

  return (
    <section className="border-y border-white/10 bg-[#0e0e0e]">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/45">Marketplace intelligence</p>
        <h2 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">{copy.headline}</h2>
        <p className="mt-4 max-w-3xl text-base leading-relaxed text-white/78">{copy.body}</p>
        <p className="mt-4 text-xs text-white/40">
          {copy.source === "openai" ? "Copy assisted by AI · verify facts locally" : "Curated marketplace messaging"}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <span
            className="rounded-full border border-white/15 px-3 py-1 text-xs font-medium text-white/80"
            style={{ borderColor: `${GOLD}55` }}
          >
            Self-optimizing discovery
          </span>
          <span className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/70">
            SEO city mesh
          </span>
        </div>
      </div>
    </section>
  );
}
