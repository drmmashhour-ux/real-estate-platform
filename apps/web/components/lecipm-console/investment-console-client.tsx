"use client";

import { useCallback, useEffect, useState } from "react";

import { Card } from "@/components/lecipm-ui/card";

type DealAnalysis = {
  id: string;
  city: string;
  roi: number;
  rating: string;
  riskScore: number;
  propertyPrice: number;
  createdAt: string;
};

type Opp = {
  id: string;
  score: number;
  expectedROI: number;
  riskLevel: string;
  listing?: { title: string; listingCode: string } | null;
};

export function InvestmentConsoleClient() {
  const [deals, setDeals] = useState<DealAnalysis[]>([]);
  const [opportunities, setOpportunities] = useState<Opp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/investment", { credentials: "same-origin" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(typeof body?.error === "string" ? body.error : `HTTP ${res.status}`);
      }
      const data = (await res.json()) as { deals?: DealAnalysis[]; opportunities?: Opp[] };
      setDeals(Array.isArray(data.deals) ? data.deals : []);
      setOpportunities(Array.isArray(data.opportunities) ? data.opportunities : []);
    } catch (e) {
      console.error("[InvestmentConsoleClient]", e);
      setError(e instanceof Error ? e.message : "Failed to load investment data");
      setDeals([]);
      setOpportunities([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6 text-white">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Investment</h1>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-lg border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300 transition hover:border-gold/40 hover:text-gold"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <Card className="animate-pulse text-neutral-500">Loading…</Card>
      ) : error ? (
        <Card className="border-red-900/60 bg-red-950/40 text-red-100">{error}</Card>
      ) : (
        <>
          <section>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gold">Your saved analyses</h2>
            {deals.length === 0 ? (
              <Card className="text-neutral-500">No saved investment analyses yet.</Card>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {deals.map((d) => (
                  <Card key={d.id}>
                    <p className="font-semibold text-white">{d.city}</p>
                    <p className="mt-1 text-sm text-neutral-400">
                      ROI {d.roi.toFixed(1)}% · {d.rating} · risk {d.riskScore.toFixed(0)}
                    </p>
                    <p className="mt-1 text-xs text-neutral-600">
                      ${d.propertyPrice.toLocaleString()} · {new Date(d.createdAt).toLocaleDateString()}
                    </p>
                  </Card>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gold">Top opportunities</h2>
            {opportunities.length === 0 ? (
              <Card className="text-neutral-500">No ranked opportunities (broker/admin only).</Card>
            ) : (
              <div className="space-y-2">
                {opportunities.map((o) => (
                  <div key={o.id} className="rounded-lg bg-[#111111] p-3 text-sm">
                    <span className="text-white">{o.listing?.title ?? "Listing"}</span>
                    <span className="ml-2 text-neutral-500">{o.listing?.listingCode}</span>
                    <p className="mt-1 text-neutral-400">
                      Score {o.score.toFixed(1)} · ROI {o.expectedROI.toFixed(1)}% · {o.riskLevel}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
