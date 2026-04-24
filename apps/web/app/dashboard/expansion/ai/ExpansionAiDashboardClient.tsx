"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type FactorRow = {
  label: string;
  weightNominal: number;
  weightEffective: number;
  input: number | null;
  contribution: number;
  note: string;
};

type RankedRow = {
  rank: number;
  market: {
    city: string;
    country: string;
    citySlug?: string;
    dataProvenance: string[];
    launchStatus?: string | null;
  };
  score: {
    score: number | null;
    dataCoverage: number;
    breakdown: FactorRow[];
  };
};

type ApiPayload = {
  success?: boolean;
  bestCity?: RankedRow["market"] | null;
  reasoning?: string[];
  riskLevel?: string;
  ranked?: RankedRow[];
  weights?: Record<string, number>;
  generatedAt?: string;
  error?: string;
};

export function ExpansionAiDashboardClient() {
  const [data, setData] = useState<ApiPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/expansion/recommendations", { credentials: "include" });
      const j = (await r.json()) as ApiPayload;
      setData(j);
    } catch {
      setData({ error: "fetch_failed" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <p className="text-sm text-zinc-500">Loading expansion recommendations…</p>;
  }

  if (!data?.success) {
    return (
      <Card className="border border-red-900/40 bg-red-950/20 p-4 text-sm text-red-200">
        {data?.error === "expansion_recommendations_failed" ? "Unable to build recommendations." : null}
        {data?.error === "fetch_failed" ? "Network error." : null}
        {!data?.error ? "Unauthorized or unavailable." : null}
        <div className="mt-3">
          <Button type="button" variant="secondary" onClick={() => void load()}>
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  const ranked = data.ranked ?? [];
  const weights = data.weights;

  return (
    <div className="space-y-6">
      <Card className="border border-zinc-800 bg-zinc-900/40 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Recommendation</h2>
            {data.bestCity ? (
              <p className="mt-3 text-lg font-medium text-zinc-50">
                {data.bestCity.city}
                <span className="text-zinc-500">, {data.bestCity.country}</span>
              </p>
            ) : (
              <p className="mt-3 text-sm text-zinc-400">No city met minimum internal data coverage for a top pick.</p>
            )}
            <p className="mt-2 text-sm text-zinc-400">
              Risk level:{" "}
              <span className="font-medium text-amber-200/90">{data.riskLevel ?? "unknown"}</span>
              {data.generatedAt ? (
                <span className="text-zinc-600"> · {new Date(data.generatedAt).toLocaleString()}</span>
              ) : null}
            </p>
          </div>
          <Button type="button" variant="secondary" onClick={() => void load()}>
            Refresh
          </Button>
        </div>
      </Card>

      {weights ? (
        <Card className="border border-zinc-800 bg-zinc-900/40 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Active weights</h2>
          <p className="mt-2 text-sm text-zinc-300">
            Demand {(weights.demand * 100).toFixed(0)}% · Competition (inverse) {(weights.competition * 100).toFixed(0)}%
            · Regulation (inverse) {(weights.regulation * 100).toFixed(0)}% · Revenue proxy{" "}
            {(weights.revenuePotential * 100).toFixed(0)}%
          </p>
          <p className="mt-2 text-xs text-zinc-500">
            Override with <code className="text-zinc-400">EXPANSION_AI_WEIGHTS_JSON</code> and normalization caps with{" "}
            <code className="text-zinc-400">EXPANSION_AI_NORM_*</code> env vars.
          </p>
        </Card>
      ) : null}

      <Card className="border border-zinc-800 bg-zinc-900/40 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Reasoning</h2>
        <ul className="mt-3 list-inside list-disc space-y-2 text-sm leading-relaxed text-zinc-200">
          {(data.reasoning ?? []).map((line, i) => (
            <li key={i} className="whitespace-pre-wrap">
              {line}
            </li>
          ))}
        </ul>
      </Card>

      <Card className="border border-zinc-800 bg-zinc-900/40 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Ranked cities</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-500">
                <th className="py-2 pr-4 font-medium">#</th>
                <th className="py-2 pr-4 font-medium">City</th>
                <th className="py-2 pr-4 font-medium">Score</th>
                <th className="py-2 pr-4 font-medium">Coverage</th>
                <th className="py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((r) => {
                const rowKey = `${r.rank}-${r.market.citySlug ?? r.market.city}`;
                return (
                <tr key={rowKey} className="border-b border-zinc-800/80">
                  <td className="py-3 pr-4 text-zinc-500">{r.rank}</td>
                  <td className="py-3 pr-4">
                    <button
                      type="button"
                      className="text-left text-zinc-100 hover:text-amber-200/90"
                      onClick={() => setExpanded((k) => (k === rowKey ? null : rowKey))}
                    >
                      {r.market.city}
                    </button>
                    <div className="text-xs text-zinc-500">{r.market.country}</div>
                  </td>
                  <td className="py-3 pr-4 font-mono text-zinc-200">
                    {r.score.score == null ? "—" : r.score.score}
                  </td>
                  <td className="py-3 pr-4 text-zinc-400">{Math.round(r.score.dataCoverage * 100)}%</td>
                  <td className="py-3 text-zinc-500">{r.market.launchStatus ?? "—"}</td>
                </tr>
              );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {ranked.map((r) => {
        const rowKey = `${r.rank}-${r.market.citySlug ?? r.market.city}`;
        if (expanded !== rowKey) return null;
        return (
          <Card key={`detail-${rowKey}`} className="border border-zinc-700 bg-zinc-900/60 p-5">
            <h3 className="text-sm font-semibold text-zinc-200">
              Breakdown — {r.market.city}
            </h3>
            <ul className="mt-3 space-y-3 text-sm text-zinc-300">
              {r.score.breakdown.map((b) => (
                <li key={b.label} className="border-l-2 border-zinc-700 pl-3">
                  <div className="font-medium text-zinc-100">{b.label}</div>
                  <div className="mt-1 text-xs text-zinc-500">
                    nominal weight {(b.weightNominal * 100).toFixed(1)}% · effective{" "}
                    {(b.weightEffective * 100).toFixed(1)}% · input{" "}
                    {b.input == null ? "n/a" : b.input.toFixed(2)}
                  </div>
                  <p className="mt-1 text-xs text-zinc-400">{b.note}</p>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-zinc-500">Provenance: {r.market.dataProvenance.join(" · ")}</p>
          </Card>
        );
      })}
    </div>
  );
}
