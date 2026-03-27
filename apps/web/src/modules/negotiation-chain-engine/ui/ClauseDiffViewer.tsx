"use client";

import type { VersionDiffResult } from "@/src/modules/negotiation-chain-engine/domain/negotiationChain.types";

export function ClauseDiffViewer({ diff }: { diff: VersionDiffResult }) {
  const interesting = diff.clauseChanges.filter((c) => c.kind !== "unchanged");
  if (!interesting.length) {
    return <p className="text-xs text-slate-500">No clause text changes between these versions.</p>;
  }
  return (
    <ul className="space-y-2 text-xs">
      {interesting.map((c, i) => (
        <li key={`${c.clauseType}-${i}`} className="rounded border border-white/10 bg-black/25 px-2 py-1.5">
          <span className="font-medium text-slate-200">{c.clauseType}</span>{" "}
          <span className="text-[10px] uppercase text-slate-500">{c.kind}</span>
          {c.detail ? <p className="mt-1 text-slate-500">{c.detail}</p> : null}
        </li>
      ))}
    </ul>
  );
}
