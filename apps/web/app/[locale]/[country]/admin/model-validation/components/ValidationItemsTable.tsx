"use client";

import { useMemo, useState } from "react";
import { confidenceTier } from "@/lib/decision-engine/scoreVisual";

export type ValidationItemRow = {
  id: string;
  entityType: string;
  entityId: string;
  predictedTrustScore: number | null;
  predictedTrustConfidence: number | null;
  predictedDealScore: number | null;
  predictedDealConfidence: number | null;
  predictedFraudScore: number | null;
  predictedRecommendation: string | null;
  humanTrustLabel: string | null;
  humanDealLabel: string | null;
  humanRiskLabel: string | null;
  agreementTrust: boolean | null;
  agreementDeal: boolean | null;
  agreementRisk: boolean | null;
  needsManualReview: boolean | null;
  fairnessRating: number | null;
};

type FilterKey = "all" | "low_conf" | "disagree" | "manual" | "suspicious";

function lowConfidence(c: number | null): boolean {
  if (c == null) return false;
  return confidenceTier(c) === "low";
}

export function ValidationItemsTable({ items }: { items: ValidationItemRow[] }) {
  const [filter, setFilter] = useState<FilterKey>("all");

  const filtered = useMemo(() => {
    return items.filter((i) => {
      const anyDisagree = i.agreementTrust === false || i.agreementDeal === false || i.agreementRisk === false;
      const lowConf =
        lowConfidence(i.predictedTrustConfidence) ||
        lowConfidence(i.predictedDealConfidence) ||
        (i.predictedFraudScore != null && i.predictedFraudScore >= 40 && i.predictedFraudScore < 65);
      const suspicious =
        (i.predictedTrustScore != null && i.predictedTrustScore >= 65 && i.humanTrustLabel && i.agreementTrust === false) ||
        (i.predictedRecommendation === "strong_opportunity" && i.agreementDeal === false);

      switch (filter) {
        case "low_conf":
          return lowConf;
        case "disagree":
          return anyDisagree;
        case "manual":
          return i.needsManualReview === true;
        case "suspicious":
          return !!suspicious;
        default:
          return true;
      }
    });
  }, [items, filter]);

  const filters: { key: FilterKey; label: string }[] = [
    { key: "all", label: "All" },
    { key: "low_conf", label: "Low confidence" },
    { key: "disagree", label: "Disagreement" },
    { key: "manual", label: "Manual review" },
    { key: "suspicious", label: "Suspicious" },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
              filter === f.key ? "border-amber-500/50 bg-amber-950/40 text-amber-100" : "border-zinc-700 text-zinc-400 hover:border-zinc-600"
            }`}
          >
            {f.label}
          </button>
        ))}
        <span className="ml-auto text-xs text-zinc-500">
          {filtered.length} / {items.length}
        </span>
      </div>

      <div className="overflow-x-auto rounded-lg border border-zinc-800">
        <table className="min-w-full text-left text-[11px]">
          <thead className="border-b border-zinc-800 bg-zinc-950 text-zinc-500">
            <tr>
              <th className="px-2 py-2">Entity</th>
              <th className="px-2 py-2">Trust</th>
              <th className="px-2 py-2">Deal</th>
              <th className="px-2 py-2">Fraud</th>
              <th className="px-2 py-2">Human T/D/R</th>
              <th className="px-2 py-2">✓</th>
              <th className="px-2 py-2">MR</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => (
              <tr key={i.id} className="border-b border-zinc-800/60 hover:bg-zinc-900/40">
                <td className="px-2 py-1.5 font-mono text-zinc-400">
                  <span className="text-zinc-500">{i.entityType.slice(0, 4)}</span> · {i.entityId.slice(0, 10)}…
                </td>
                <td className="px-2 py-1.5 tabular-nums text-zinc-300">
                  {i.predictedTrustScore ?? "—"}{" "}
                  <span className="text-zinc-600">({i.predictedTrustConfidence ?? "—"})</span>
                </td>
                <td className="px-2 py-1.5 text-zinc-300">
                  {i.predictedDealScore ?? "—"}{" "}
                  <span className="block text-[10px] text-zinc-500">{i.predictedRecommendation ?? "—"}</span>
                </td>
                <td className="px-2 py-1.5 tabular-nums text-zinc-300">{i.predictedFraudScore ?? "—"}</td>
                <td className="px-2 py-1.5 text-zinc-400">
                  {i.humanTrustLabel ?? "—"} / {i.humanDealLabel ?? "—"} / {i.humanRiskLabel ?? "—"}
                </td>
                <td className="px-2 py-1.5">
                  {i.agreementTrust === true ? "T" : i.agreementTrust === false ? "t" : "—"}
                  {i.agreementDeal === true ? "D" : i.agreementDeal === false ? "d" : "—"}
                  {i.agreementRisk === true ? "R" : i.agreementRisk === false ? "r" : "—"}
                </td>
                <td className="px-2 py-1.5">{i.needsManualReview ? "⚠" : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
