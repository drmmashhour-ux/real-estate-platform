"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { Drawer } from "@/components/ui/Drawer";
import { Card } from "@/components/ui/Card";
import {
  formatExpectedRoiBand,
  summarizeRationale,
} from "@/modules/investment/investment-opportunity-formatters";

type OpportunityRow = {
  id: string;
  listingId: string;
  score: number;
  expectedROI: number;
  riskLevel: string;
  recommendedInvestmentMajor: number | null;
  rationaleJson: unknown;
  createdAt: string;
  listingTitle: string | null;
};

const RISK_OPTIONS = ["LOW", "MEDIUM", "HIGH"] as const;

export function InvestmentOpportunityTable() {
  const [riskPick, setRiskPick] = useState<Record<string, boolean>>({
    LOW: true,
    MEDIUM: true,
    HIGH: true,
  });
  const [minScore, setMinScore] = useState<number | "">("");
  const [maxScore, setMaxScore] = useState<number | "">("");
  const [rows, setRows] = useState<OpportunityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<OpportunityRow | null>(null);

  const riskLevels = useMemo(
    () => RISK_OPTIONS.filter((r) => riskPick[r]),
    [riskPick]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams();
      if (riskLevels.length > 0 && riskLevels.length < RISK_OPTIONS.length) {
        qs.set("riskLevels", riskLevels.join(","));
      }
      if (minScore !== "") qs.set("minScore", String(minScore));
      if (maxScore !== "") qs.set("maxScore", String(maxScore));

      const res = await fetch(`/api/autonomous-brain/opportunities?${qs.toString()}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data?.error === "string" ? data.error : "load_failed");
        setRows([]);
        return;
      }
      setRows((data.opportunities ?? []) as OpportunityRow[]);
    } catch {
      setError("network_error");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [riskLevels, minScore, maxScore]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <>
      <Card variant="dashboardPanel" className="space-y-4">
        <div className="flex flex-col gap-3">
          <div>
            <h3 className="text-base font-semibold text-[#0B0B0B]">Investment Opportunities</h3>
            <p className="text-sm text-[#5C5C57]">
              Source: CRM listing snapshots → investment_opportunities.{" "}
              <span className="font-medium text-[#0B0B0B]">Advisory only</span> — not personalized investment
              advice or execution.
            </p>
          </div>

          <div className="flex flex-wrap gap-4 text-sm">
            <span className="text-[#5C5C57]">Risk:</span>
            {RISK_OPTIONS.map((r) => (
              <label key={r} className="flex items-center gap-2 text-[#0B0B0B]">
                <input
                  type="checkbox"
                  checked={riskPick[r]}
                  onChange={(e) => setRiskPick((prev) => ({ ...prev, [r]: e.target.checked }))}
                />
                {r}
              </label>
            ))}
            <label className="flex items-center gap-2 text-[#5C5C57]">
              Min score
              <input
                type="number"
                value={minScore}
                onChange={(e) =>
                  setMinScore(e.target.value === "" ? "" : Number(e.target.value))
                }
                className="w-24 rounded-lg border border-[#D9D9D2] px-2 py-1 text-[#0B0B0B]"
              />
            </label>
            <label className="flex items-center gap-2 text-[#5C5C57]">
              Max score
              <input
                type="number"
                value={maxScore}
                onChange={(e) =>
                  setMaxScore(e.target.value === "" ? "" : Number(e.target.value))
                }
                className="w-24 rounded-lg border border-[#D9D9D2] px-2 py-1 text-[#0B0B0B]"
              />
            </label>
          </div>
        </div>

        {error ?
          <p className="text-sm text-red-700">{error}</p>
        : null}
        {loading ?
          <p className="text-sm text-[#5C5C57]">Loading opportunities…</p>
        : null}

        {!loading && !error && rows.length === 0 ?
          <p className="text-sm text-[#5C5C57]">No rows match filters.</p>
        : null}

        {!loading && rows.length > 0 ?
          <div className="overflow-x-auto rounded-lg border border-[#D9D9D2]">
            <table className="min-w-full text-left text-sm text-[#0B0B0B]">
              <thead className="bg-[#FAFAF7] text-xs uppercase tracking-wide text-[#5C5C57]">
                <tr>
                  <th className="px-3 py-2">Listing</th>
                  <th className="px-3 py-2">Score</th>
                  <th className="px-3 py-2">ROI band</th>
                  <th className="px-3 py-2">Risk</th>
                  <th className="px-3 py-2">Sizing hint</th>
                  <th className="px-3 py-2">Rationale</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((o) => (
                  <tr key={o.id} className="border-t border-[#EEE]">
                    <td className="px-3 py-2">{o.listingTitle ?? o.listingId}</td>
                    <td className="px-3 py-2">{o.score.toFixed(1)}</td>
                    <td className="px-3 py-2">{formatExpectedRoiBand(o.expectedROI)}</td>
                    <td className="px-3 py-2">{o.riskLevel}</td>
                    <td className="px-3 py-2">
                      {o.recommendedInvestmentMajor != null ?
                        `${o.recommendedInvestmentMajor.toFixed(0)} (major)`
                      : "—"}
                    </td>
                    <td className="max-w-xs px-3 py-2">
                      <button
                        type="button"
                        className="text-left text-premium-gold underline-offset-4 hover:underline"
                        onClick={() => {
                          setActive(o);
                          setOpen(true);
                        }}
                      >
                        {summarizeRationale(o.rationaleJson) || "View rationale JSON"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        : null}
      </Card>

      <Drawer
        open={open}
        title="Opportunity rationale (JSON)"
        onClose={() => {
          setOpen(false);
          setActive(null);
        }}
      >
        {active ?
          <pre className="whitespace-pre-wrap break-words text-xs text-zinc-200">
            {JSON.stringify(active.rationaleJson ?? {}, null, 2)}
          </pre>
        : null}
      </Drawer>
    </>
  );
}
