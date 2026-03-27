"use client";

import { useEffect, useMemo, useState } from "react";
import { diffVersions } from "@/src/modules/negotiation-chain-engine/application/diffVersions";
import type { NegotiationVersionWithDetails, VersionDiffResult } from "@/src/modules/negotiation-chain-engine/domain/negotiationChain.types";
import { clausesForDiff, termFromVersion } from "@/src/modules/negotiation-chain-engine/lib/negotiationVersionDiffUtils";
import { ClauseDiffViewer } from "@/src/modules/negotiation-chain-engine/ui/ClauseDiffViewer";

export function VersionComparisonPanel({
  history,
  presetFromIndex,
  presetToIndex,
}: {
  history: NegotiationVersionWithDetails[];
  presetFromIndex?: number;
  presetToIndex?: number;
}) {
  const sorted = useMemo(() => [...history].sort((x, y) => x.versionNumber - y.versionNumber), [history]);
  const maxIdx = Math.max(0, sorted.length - 1);
  const [a, setA] = useState(0);
  const [b, setB] = useState(maxIdx);
  const aIdx = Math.min(a, maxIdx);
  const bIdx = Math.min(b, maxIdx);

  useEffect(() => {
    if (presetFromIndex !== undefined) setA(Math.min(presetFromIndex, maxIdx));
  }, [presetFromIndex, maxIdx]);

  useEffect(() => {
    if (presetToIndex !== undefined) setB(Math.min(presetToIndex, maxIdx));
  }, [presetToIndex, maxIdx]);

  const diff: VersionDiffResult | null = useMemo(() => {
    if (sorted.length < 2 || aIdx === bIdx) return null;
    const v1 = sorted[aIdx];
    const v2 = sorted[bIdx];
    if (!v1 || !v2) return null;
    const t1 = termFromVersion(v1);
    const t2 = termFromVersion(v2);
    if (!t1 || !t2) return null;
    return diffVersions(t1, clausesForDiff(v1), t2, clausesForDiff(v2));
  }, [sorted, aIdx, bIdx]);

  if (sorted.length < 2) {
    return <p className="text-xs text-slate-500">Add at least two versions to compare changes.</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <label className="text-[10px] text-slate-500">
          From
          <select
            value={aIdx}
            onChange={(e) => setA(Number(e.target.value))}
            className="ml-2 rounded border border-white/10 bg-black px-2 py-1 text-xs text-white"
          >
            {sorted.map((v, i) => (
              <option key={v.id} value={i}>
                v{v.versionNumber}
              </option>
            ))}
          </select>
        </label>
        <label className="text-[10px] text-slate-500">
          To
          <select
            value={bIdx}
            onChange={(e) => setB(Number(e.target.value))}
            className="ml-2 rounded border border-white/10 bg-black px-2 py-1 text-xs text-white"
          >
            {sorted.map((v, i) => (
              <option key={v.id} value={i}>
                v{v.versionNumber}
              </option>
            ))}
          </select>
        </label>
      </div>
      {diff && aIdx !== bIdx ? (
        <div className="space-y-2 rounded-lg border border-white/10 bg-black/20 p-3 text-xs text-slate-300">
          <p>
            Price delta:{" "}
            {diff.priceDeltaCents != null
              ? `${diff.priceDeltaCents / 100 >= 0 ? "+" : ""}$${(diff.priceDeltaCents / 100).toLocaleString()}`
              : "—"}
          </p>
          <p>Deposit changed: {diff.depositChanged ? "yes" : "no"}</p>
          <p>Financing JSON: {diff.financingTermsChanged ? "changed" : "same"}</p>
          <p>Commission JSON: {diff.commissionTermsChanged ? "changed" : "same"}</p>
          <p>Deadlines JSON: {diff.deadlinesChanged ? "changed" : "same"}</p>
          <div>
            <p className="text-[10px] font-semibold uppercase text-slate-500">Clauses</p>
            <ClauseDiffViewer diff={diff} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
