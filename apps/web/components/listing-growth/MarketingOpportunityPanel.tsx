import type { ListingMarketingIntelligenceResult } from "@/modules/listing-marketing-intelligence/listing-marketing-intelligence.types";

export function MarketingOpportunityPanel({ intelligence }: { intelligence: unknown }) {
  const intel = intelligence as ListingMarketingIntelligenceResult | null;
  if (!intel) return null;
  return (
    <div className="rounded-xl border border-amber-900/35 bg-black/45 p-4">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Opportunités & alertes</h3>
      <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-zinc-300">
        {intel.opportunities.map((o) => (
          <li key={o}>{o}</li>
        ))}
      </ul>
      {intel.warnings.length > 0 && (
        <ul className="mt-3 list-disc space-y-1 pl-4 text-sm text-amber-200/80">
          {intel.warnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
