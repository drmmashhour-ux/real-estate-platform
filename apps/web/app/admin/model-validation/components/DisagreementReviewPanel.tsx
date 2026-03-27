"use client";

import type { ValidationItemRow } from "./ValidationItemsTable";

function disagreementScore(i: ValidationItemRow): number {
  let n = 0;
  if (i.agreementTrust === false) n += 3;
  if (i.agreementDeal === false) n += 3;
  if (i.agreementRisk === false) n += 2;
  return n;
}

export function DisagreementReviewPanel({ items }: { items: ValidationItemRow[] }) {
  const ranked = [...items]
    .filter((i) => i.agreementTrust === false || i.agreementDeal === false || i.agreementRisk === false)
    .sort((a, b) => disagreementScore(b) - disagreementScore(a))
    .slice(0, 12);

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Largest disagreements</p>
      <p className="mt-1 text-xs text-zinc-600">Ranked by weighted mismatch (trust/deal weighted higher).</p>
      <ul className="mt-4 space-y-2">
        {ranked.length === 0 ? (
          <li className="text-sm text-zinc-500">No disagreements yet — add human labels.</li>
        ) : (
          ranked.map((i) => (
            <li key={i.id} className="rounded border border-zinc-800/80 bg-black/30 px-3 py-2 text-xs">
              <p className="font-mono text-zinc-400">{i.entityId}</p>
              <p className="mt-1 text-zinc-300">
                pred T {i.predictedTrustScore ?? "—"} · D {i.predictedDealScore ?? "—"} ({i.predictedRecommendation ?? "—"}) · F{" "}
                {i.predictedFraudScore ?? "—"}
              </p>
              <p className="mt-1 text-amber-200/80">
                human: {i.humanTrustLabel ?? "—"} / {i.humanDealLabel ?? "—"} / {i.humanRiskLabel ?? "—"}
              </p>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
