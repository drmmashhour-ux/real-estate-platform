"use client";

import { useCallback, useEffect, useState } from "react";

import { Card } from "@/components/ui/Card";

type PatternRow = {
  id: string;
  pattern: string;
  confidence: number;
  impactScore: number;
  sampleSize: number;
  createdAt: string;
  updatedAt: string;
};

type SortKey = "confidence" | "impactScore";

export function LearningPatternTable() {
  const [sortBy, setSortBy] = useState<SortKey>("confidence");
  const [minSampleSize, setMinSampleSize] = useState(0);
  const [patterns, setPatterns] = useState<PatternRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({
        sortBy,
        sortDir: "desc",
        minSampleSize: String(minSampleSize),
      });
      const res = await fetch(`/api/autonomous-brain/patterns?${qs.toString()}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data?.error === "string" ? data.error : "load_failed");
        setPatterns([]);
        return;
      }
      setPatterns((data.patterns ?? []) as PatternRow[]);
    } catch {
      setError("network_error");
      setPatterns([]);
    } finally {
      setLoading(false);
    }
  }, [sortBy, minSampleSize]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <Card variant="dashboardPanel" className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-[#0B0B0B]">Learning Patterns</h3>
          <p className="text-sm text-[#5C5C57]">
            Data source: DealOutcome aggregates.{" "}
            <span className="font-medium text-[#0B0B0B]">Advisory only</span> — patterns inform playbooks,
            not automatic policy changes here.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <label className="flex items-center gap-2 text-[#5C5C57]">
            Sort by
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
              className="rounded-lg border border-[#D9D9D2] bg-white px-2 py-1.5 text-[#0B0B0B]"
            >
              <option value="confidence">Confidence</option>
              <option value="impactScore">Impact</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-[#5C5C57]">
            Min samples
            <input
              type="number"
              min={0}
              value={minSampleSize}
              onChange={(e) => setMinSampleSize(Number(e.target.value) || 0)}
              className="w-20 rounded-lg border border-[#D9D9D2] bg-white px-2 py-1.5 text-[#0B0B0B]"
            />
          </label>
        </div>
      </div>

      {error ?
        <p className="text-sm text-red-700">{error}</p>
      : null}
      {loading ?
        <p className="text-sm text-[#5C5C57]">Loading patterns…</p>
      : null}

      {!loading && !error && patterns.length === 0 ?
        <p className="text-sm text-[#5C5C57]">No patterns match your filters.</p>
      : null}

      {!loading && patterns.length > 0 ?
        <div className="overflow-x-auto rounded-lg border border-[#D9D9D2]">
          <table className="min-w-full text-left text-sm text-[#0B0B0B]">
            <thead className="bg-[#FAFAF7] text-xs uppercase tracking-wide text-[#5C5C57]">
              <tr>
                <th className="px-3 py-2">Pattern</th>
                <th className="px-3 py-2">Confidence</th>
                <th className="px-3 py-2">Impact</th>
                <th className="px-3 py-2">Samples</th>
                <th className="px-3 py-2">Created</th>
                <th className="px-3 py-2">Updated</th>
              </tr>
            </thead>
            <tbody>
              {patterns.map((p) => (
                <tr key={p.id} className="border-t border-[#EEE]">
                  <td className="max-w-md px-3 py-2 text-[#0B0B0B]">{p.pattern}</td>
                  <td className="px-3 py-2">{(p.confidence * 100).toFixed(1)}%</td>
                  <td className="px-3 py-2">{p.impactScore.toFixed(3)}</td>
                  <td className="px-3 py-2">{p.sampleSize}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-[#5C5C57]">
                    {new Date(p.createdAt).toLocaleString()}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-[#5C5C57]">
                    {new Date(p.updatedAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      : null}

      <p className="text-xs text-[#5C5C57]">
        Why sorted: prioritization favors higher {sortBy === "confidence" ? "model confidence" : "business impact score"}{" "}
        when evidence (sample size) meets your floor.
      </p>
    </Card>
  );
}
