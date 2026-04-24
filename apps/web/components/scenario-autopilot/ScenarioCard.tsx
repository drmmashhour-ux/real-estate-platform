import type { EnrichedCandidate } from "@/modules/scenario-autopilot/scenario-autopilot.types";

export function ScenarioCard(props: { candidate: EnrichedCandidate; highlight?: boolean; onSelect?: () => void }) {
  const { candidate: c, highlight, onSelect } = props;
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-lg border p-4 text-left transition ${
        highlight ? "border-[#D4AF37] bg-[#D4AF37]/5" : "border-[#2a2a2a] bg-[#0a0a0a] hover:border-[#D4AF37]/30"
      }`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#D4AF37]/80">{c.domain}</p>
      <p className="mt-1 text-sm font-medium text-[#f4efe4]">{c.title}</p>
      <p className="mt-1 text-xs text-neutral-500">
        Rev Δ {c.normalized.revenueDelta.toFixed(1)}% · risk {c.riskLevel} · reversible: {c.reversible ? "yes" : "no"}
      </p>
    </button>
  );
}
