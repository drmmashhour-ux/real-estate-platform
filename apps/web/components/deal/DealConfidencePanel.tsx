import type { DealAnalysisPublicDto } from "@/modules/deal-analyzer/domain/contracts";

export function DealConfidencePanel({ phase2 }: { phase2: NonNullable<DealAnalysisPublicDto["phase2"]> }) {
  const comp = phase2.comparables?.summary?.confidenceLevel;
  const scen =
    phase2.scenarios && phase2.scenarios.length > 0
      ? phase2.scenarios.every((s) => s.confidenceLevel === "low")
        ? "low"
        : phase2.scenarios.some((s) => s.confidenceLevel === "low")
          ? "medium"
          : "high"
      : null;
  const bn = phase2.bnhub?.confidenceLevel ?? null;

  return (
    <div className="rounded-xl border border-white/10 bg-[#121212] p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#A1A1A1]">Phase 2 confidence</p>
      <dl className="mt-3 space-y-2 text-sm text-slate-300">
        <div className="flex justify-between gap-4">
          <dt>Comparables</dt>
          <dd className="font-medium text-white">{comp ?? "—"}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt>Scenarios</dt>
          <dd className="font-medium text-white">{scen ?? "—"}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt>BNHub</dt>
          <dd className="font-medium text-white">{bn ?? "—"}</dd>
        </div>
      </dl>
    </div>
  );
}
