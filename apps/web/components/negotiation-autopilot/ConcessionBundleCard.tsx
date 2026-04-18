import type { NegotiationEngineOutput } from "@/modules/negotiation-copilot/negotiation.types";

export function ConcessionBundleCard({ outputs }: { outputs: NegotiationEngineOutput[] }) {
  const bundle = outputs.filter((o) => o.suggestionType === "concession_bundle");
  if (bundle.length === 0) return null;
  return (
    <div className="rounded-xl border border-ds-gold/20 bg-black/30 p-4">
      <h4 className="text-sm font-medium text-ds-gold">Bundled concessions</h4>
      <p className="mt-2 text-sm text-ds-text-secondary">{bundle[0]?.summary}</p>
    </div>
  );
}
