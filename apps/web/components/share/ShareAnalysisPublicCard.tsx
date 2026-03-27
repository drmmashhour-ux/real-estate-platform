import { riskLevelPublic } from "@/modules/deal-analyzer/domain/scoring";

type Props = {
  city: string;
  titleHint: string;
  trustScore: number | null;
  dealScore: number | null;
  recommendation: string | null;
  riskScore: number | null;
};

export function ShareAnalysisPublicCard({ city, titleHint, trustScore, dealScore, recommendation, riskScore }: Props) {
  const risk = riskScore != null ? riskLevelPublic(riskScore) : null;
  return (
    <div className="rounded-2xl border border-[#C9A646]/25 bg-[#141414] p-6 shadow-[0_16px_48px_rgba(0,0,0,0.5)]">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#C9A646]">Shared snapshot</p>
      <p className="mt-2 text-sm text-slate-400">{city}</p>
      <p className="mt-1 text-base font-medium text-white">{titleHint}</p>
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-white/10 bg-black/40 p-4">
          <p className="text-[10px] uppercase text-slate-500">Trust</p>
          <p className="mt-1 text-3xl font-bold text-white">{trustScore ?? "—"}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/40 p-4">
          <p className="text-[10px] uppercase text-slate-500">Deal</p>
          <p className="mt-1 text-3xl font-bold text-white">{dealScore ?? "—"}</p>
        </div>
      </div>
      {recommendation ? (
        <div className="mt-4">
          <p className="text-[10px] uppercase text-slate-500">Signal</p>
          <p className="mt-1 text-sm capitalize text-slate-200">{recommendation.replace(/_/g, " ")}</p>
        </div>
      ) : null}
      {risk ? (
        <div className="mt-4">
          <p className="text-[10px] uppercase text-slate-500">Risk level</p>
          <p className="mt-1 text-sm font-medium capitalize text-slate-200">{risk}</p>
        </div>
      ) : null}
    </div>
  );
}
