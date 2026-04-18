import type { ListingMarketingIntelligenceResult } from "@/modules/listing-marketing-intelligence/listing-marketing-intelligence.types";

export function ListingHealthCard({ intelligence }: { intelligence: unknown }) {
  const intel = intelligence as ListingMarketingIntelligenceResult | null;
  if (!intel) {
    return (
      <div className="rounded-xl border border-amber-900/35 bg-black/45 p-4 text-sm text-zinc-500">
        Aucune analyse — lancez « Analyser ».
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-amber-900/35 bg-black/45 p-4">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Santé (scores internes)</h3>
      <dl className="mt-3 grid grid-cols-3 gap-2 text-center font-mono text-lg text-amber-100">
        <div>
          <dt className="text-[10px] font-normal text-zinc-500">Santé</dt>
          <dd>{intel.healthScore}</dd>
        </div>
        <div>
          <dt className="text-[10px] font-normal text-zinc-500">Exposition</dt>
          <dd>{intel.exposureScore}</dd>
        </div>
        <div>
          <dt className="text-[10px] font-normal text-zinc-500">Conversion</dt>
          <dd>{intel.conversionScore}</dd>
        </div>
      </dl>
      <p className="mt-2 text-[10px] text-zinc-600">
        Scores dérivés des métriques plateforme — pas une promesse de performance marché.
      </p>
    </div>
  );
}
