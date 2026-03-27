"use client";

import Link from "next/link";

type Props = {
  projectId: string;
  score: number;
  rank?: number;
  appreciationPotential: number;
  rentalYield: number;
  riskScore: number;
  reason: string;
  bestUnitSuggestion: { unitId: string | null; label: string; predictedValue: number };
};

export function InvestmentRankCard({ projectId, score, rank, appreciationPotential, rentalYield, riskScore, reason, bestUnitSuggestion }: Props) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Rank {rank ?? "—"}</p>
          <p className="mt-1 text-xl font-semibold text-white">Project score {score}/100</p>
        </div>
        <span className="rounded-full bg-teal-500/20 px-2.5 py-1 text-xs font-medium text-teal-300">
          {bestUnitSuggestion.label}
        </span>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-teal-500" style={{ width: `${score}%` }} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl bg-white/5 p-3">
          <p className="text-xs text-slate-500">Appreciation</p>
          <p className="mt-1 font-semibold text-teal-300">{appreciationPotential}%</p>
        </div>
        <div className="rounded-xl bg-white/5 p-3">
          <p className="text-xs text-slate-500">Rental yield</p>
          <p className="mt-1 font-semibold text-teal-300">{(rentalYield * 100).toFixed(1)}%</p>
        </div>
        <div className="rounded-xl bg-white/5 p-3">
          <p className="text-xs text-slate-500">Risk score</p>
          <p className="mt-1 font-semibold text-amber-300">{riskScore}/100</p>
        </div>
        <div className="rounded-xl bg-white/5 p-3">
          <p className="text-xs text-slate-500">Best unit</p>
          <p className="mt-1 font-semibold text-white">${bestUnitSuggestion.predictedValue.toLocaleString()}</p>
        </div>
      </div>
      <p className="mt-4 text-sm text-slate-300">{reason}</p>
      <Link href={`/projects/${projectId}`} className="mt-4 inline-block text-sm font-medium text-teal-400 hover:underline">
        View project →
      </Link>
    </div>
  );
}
