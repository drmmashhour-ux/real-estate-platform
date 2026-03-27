"use client";

import Link from "next/link";

type Props = {
  projectId: string;
  matchScore: number;
  reasons: string[];
  recommendedUnitId: string | null;
};

export function MatchedProjectCard({ projectId, matchScore, reasons, recommendedUnitId }: Props) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-xl">
      <div className="flex items-center justify-between">
        <p className="text-lg font-semibold text-white">Match {matchScore}/100</p>
        <span className="rounded-full bg-teal-500/20 px-2.5 py-1 text-xs font-medium text-teal-300">Matched</span>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-teal-500" style={{ width: `${matchScore}%` }} />
      </div>
      <ul className="mt-4 space-y-1 text-sm text-slate-300">
        {reasons.slice(0, 4).map((reason) => <li key={reason}>• {reason}</li>)}
      </ul>
      {recommendedUnitId && <p className="mt-3 text-xs text-slate-500">Recommended unit: {recommendedUnitId}</p>}
      <Link href={`/projects/${projectId}`} className="mt-4 inline-block text-sm font-medium text-teal-400 hover:underline">
        View Project →
      </Link>
    </div>
  );
}
