"use client";

import { useCallback, useEffect, useState } from "react";
import type { PortfolioIntelligenceBundle } from "@/modules/portfolio/portfolio.types";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function PortfolioDashboardClient({ basePath }: { basePath: string }) {
  const [data, setData] = useState<PortfolioIntelligenceBundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/portfolio/intelligence", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load");
      const json = (await res.json()) as PortfolioIntelligenceBundle;
      setData(json);
    } catch {
      setError("Portfolio intelligence unavailable.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading portfolio intelligence…</p>;
  }
  if (error || !data) {
    return (
      <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm">
        {error ?? "No data"}
        <Button variant="outline" size="sm" className="ml-3" type="button" onClick={() => void load()}>
          Retry
        </Button>
      </div>
    );
  }

  const { overview, priorities, capitalAllocation, watchlist, commonThemes } = data;

  return (
    <div className="space-y-10">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border bg-card p-4">
          <div className="text-xs font-medium uppercase text-muted-foreground">Total assets</div>
          <div className="mt-1 text-2xl font-semibold">{overview.totalAssets}</div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="text-xs font-medium uppercase text-muted-foreground">Avg health band</div>
          <div className="mt-1 text-2xl font-semibold">{overview.averageHealthBand}</div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="text-xs font-medium uppercase text-muted-foreground">Policy mode</div>
          <div className="mt-1 text-2xl font-semibold">{overview.policyMode}</div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="text-xs font-medium uppercase text-muted-foreground">Critical</div>
          <div className="mt-1 text-2xl font-semibold text-destructive">{overview.criticalCount}</div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="text-xs font-medium uppercase text-muted-foreground">Watchlist</div>
          <div className="mt-1 text-2xl font-semibold">{overview.watchlistCount}</div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="text-xs font-medium uppercase text-muted-foreground">Quick wins</div>
          <div className="mt-1 text-2xl font-semibold">{overview.quickWinsCount}</div>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Capital need summary</h2>
        <p className="mt-2 text-sm text-muted-foreground">{overview.capitalNeedSummary}</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Priority board</h2>
        <ul className="mt-3 divide-y rounded-xl border">
          {priorities.slice(0, 20).map((p) => (
            <li key={`${p.assetId}-${p.rank}`} className="flex flex-col gap-1 p-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="font-medium">
                  #{p.rank} · {p.title}
                </div>
                <div className="text-xs text-muted-foreground">{p.priorityType}</div>
                <p className="mt-1 text-sm text-muted-foreground">{p.explanation}</p>
              </div>
              <Button asChild variant="outline" size="sm" className="shrink-0">
                <Link href={`${basePath}/dashboard/portfolio/assets/${p.assetId}`}>Asset</Link>
              </Button>
            </li>
          ))}
        </ul>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="text-lg font-semibold">Capital allocation (bands)</h2>
          <p className="mt-1 text-xs text-muted-foreground">{capitalAllocation.disclosure}</p>
          <ul className="mt-3 space-y-2 text-sm">
            {capitalAllocation.allocationSummary.slice(0, 12).map((row) => (
              <li key={row.assetId} className="rounded-lg border p-3">
                <div className="font-medium">{row.assetName ?? row.assetId.slice(0, 8)}</div>
                <div className="text-muted-foreground">
                  {row.budgetBand} · ~{row.percentOfNotionalPortfolio}% notional
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-lg font-semibold">Pools</h2>
          <div className="mt-3 space-y-4 text-sm">
            <div>
              <div className="font-medium text-destructive">Urgent fixes</div>
              <ul className="mt-1 list-disc pl-5 text-muted-foreground">
                {capitalAllocation.reservedForUrgentFixes.map((x) => (
                  <li key={x.assetId}>{x.assetId.slice(0, 8)} — {x.rationale}</li>
                ))}
              </ul>
            </div>
            <div>
              <div className="font-medium">Quick win pool</div>
              <ul className="mt-1 list-disc pl-5 text-muted-foreground">
                {capitalAllocation.quickWinPool.map((x) => (
                  <li key={x.assetId}>{x.assetId.slice(0, 8)}</li>
                ))}
              </ul>
            </div>
            <div>
              <div className="font-medium">Strategic capex pool</div>
              <ul className="mt-1 list-disc pl-5 text-muted-foreground">
                {capitalAllocation.strategicCapexPool.map((x) => (
                  <li key={x.assetId}>{x.assetId.slice(0, 8)}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Watchlist</h2>
        <ul className="mt-3 divide-y rounded-xl border">
          {watchlist.map((w) => (
            <li key={w.assetId} className="flex items-center justify-between gap-4 p-4">
              <div>
                <div className="font-medium">{w.assetName ?? w.assetId.slice(0, 8)}</div>
                <div className="text-sm text-muted-foreground">{w.reason}</div>
              </div>
              <span className="rounded-full bg-muted px-3 py-1 text-xs">{w.healthBand}</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Common action themes</h2>
        <ul className="mt-2 list-disc space-y-1 pl-6 text-sm text-muted-foreground">
          {commonThemes.map((t) => (
            <li key={t}>{t}</li>
          ))}
          {commonThemes.length === 0 ? <li>No recurring themes detected.</li> : null}
        </ul>
      </section>

      <div className="flex flex-wrap gap-3">
        <Button asChild variant="secondary">
          <Link href={`${basePath}/dashboard/portfolio/intelligence`}>Optimization & runs</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={`${basePath}/dashboard/portfolio/capital`}>Capital detail</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={`${basePath}/dashboard/portfolio/reports`}>Reports</Link>
        </Button>
      </div>
    </div>
  );
}
