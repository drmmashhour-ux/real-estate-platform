import Link from "next/link";
import type { DealAnalysisPublicDto } from "@/modules/deal-analyzer/domain/contracts";

type Props = {
  listingId: string;
  trustScore: number | null;
  analysis: DealAnalysisPublicDto | null;
  missingItemsCount: number;
};

function riskTone(level: string | undefined): string {
  if (level === "high") return "text-amber-200";
  if (level === "medium") return "text-slate-200";
  if (level === "low") return "text-emerald-200/90";
  return "text-slate-400";
}

/**
 * Right-rail deal + trust summary — premium “money screen” (presentation only; parents load DTOs).
 */
export function PropertyDealInsightRail({ listingId, trustScore, analysis, missingItemsCount }: Props) {
  const dealScore = analysis ? String(analysis.investmentScore) : "—";
  const rec = analysis?.recommendation?.replace(/_/g, " ") ?? "Run analysis";
  const conf = analysis?.confidenceLevel ?? "—";
  const risk = analysis?.riskLevel;

  return (
    <div className="space-y-4 rounded-2xl border border-[#C9A646]/25 bg-[#0D0D0D] p-5 shadow-[0_16px_48px_rgba(0,0,0,0.55)]">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#C9A646]">Decision summary</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-white/[0.08] bg-[#141414] p-4 shadow-inner shadow-black/40">
          <p className="text-[10px] uppercase tracking-wide text-slate-500">Trust</p>
          <p className="mt-1 text-4xl font-bold tabular-nums tracking-tight text-white">{trustScore ?? "—"}</p>
        </div>
        <div className="rounded-xl border border-white/[0.08] bg-[#141414] p-4 shadow-inner shadow-black/40">
          <p className="text-[10px] uppercase tracking-wide text-slate-500">Deal</p>
          <p className="mt-1 text-4xl font-bold tabular-nums tracking-tight text-white">{dealScore}</p>
        </div>
      </div>
      <div className="rounded-xl border border-white/[0.06] bg-[#121212] px-4 py-3">
        <p className="text-[10px] uppercase tracking-wide text-slate-500">Recommendation</p>
        <p className="mt-1 text-sm font-semibold capitalize text-slate-100">{rec}</p>
        <p className="mt-1 text-xs text-slate-500">Confidence: {conf}</p>
      </div>
      <div className="rounded-xl border border-white/[0.06] bg-[#121212] px-4 py-3">
        <p className="text-[10px] uppercase tracking-wide text-slate-500">Risk level</p>
        <p className={`mt-1 text-lg font-semibold capitalize ${riskTone(risk)}`}>{risk ?? "—"}</p>
        <p className="mt-1 text-[11px] text-slate-600">Rules-based — not an appraisal.</p>
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-wide text-slate-500">Issues to clear</p>
        <p className="mt-1 text-3xl font-bold text-white">{missingItemsCount}</p>
        <p className="text-xs text-slate-500">Complete verification & declaration to improve scores.</p>
      </div>
      <Link
        href={`/dashboard/seller/create?id=${encodeURIComponent(listingId)}`}
        className="flex w-full items-center justify-center rounded-full bg-[#C9A646] py-3 text-sm font-bold text-black shadow-[0_8px_24px_rgba(201,166,70,0.25)] transition hover:bg-[#d4b35c]"
      >
        Fix issues now
      </Link>
    </div>
  );
}
