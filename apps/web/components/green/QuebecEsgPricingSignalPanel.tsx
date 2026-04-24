import type { GreenListingMetadata } from "@/modules/green/green.types";
import { QUEBEC_ESG_INCENTIVES_UI_DISCLAIMER } from "@/modules/green-ai/quebec-esg-disclaimers";
import type { GreenPricingBoostSignal } from "@/modules/green-ai/quebec-esg-pricing-boost.service";

type Econ = GreenListingMetadata["quebecEsgEconomicsSnapshot"];

function asBoost(raw: unknown): GreenPricingBoostSignal | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.scoreInfluence !== "number") return null;
  return raw as GreenPricingBoostSignal;
}

/** Internal ranking signal — show only to broker/admin contexts. */
export function QuebecEsgPricingSignalPanel({
  snapshot,
  visible,
}: {
  snapshot: Econ | undefined;
  visible: boolean;
}) {
  if (!visible) return null;
  const boost = snapshot?.pricingBoost ? asBoost(snapshot.pricingBoost) : null;
  if (!boost) {
    return (
      <div className="mt-3 rounded-lg border border-amber-500/20 bg-amber-950/20 px-3 py-2 text-[11px] text-amber-200/80">
        Internal pricing signal not available for this listing snapshot.
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-2 rounded-lg border border-amber-500/30 bg-amber-950/30 px-3 py-3 text-xs text-amber-100/90">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-400/90">Internal ranking signal (not public pricing)</p>
      <p className="text-[11px] text-amber-100/80">
        Score influence index: {boost.scoreInfluence} · Label tilt: {boost.labelInfluence}
        {boost.rankingBoostSuggestion != null ? ` · Suggested discovery multiplier: ${boost.rankingBoostSuggestion}` : null}
      </p>
      <ul className="list-inside list-disc space-y-1 text-[10px] text-amber-200/70">
        {boost.rationale.map((r, i) => (
          <li key={i}>{r}</li>
        ))}
      </ul>
      <p className="text-[10px] leading-relaxed text-slate-500">{QUEBEC_ESG_INCENTIVES_UI_DISCLAIMER}</p>
    </div>
  );
}
