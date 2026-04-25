"use client";

import { useCallback, useEffect, useState } from "react";
import { BrokerLoadPanel } from "./BrokerLoadPanel";
import { DealPriorityList } from "./DealPriorityList";
import { LeadRoutingPanel } from "./LeadRoutingPanel";
import { SegmentInsightsPanel } from "./SegmentInsightsPanel";
import type { PortfolioAnalysisResult } from "@/modules/brokerage-intelligence/brokerage-intelligence.engine";
import type { BrokerLoadEntry } from "@/modules/brokerage-intelligence/brokerage-intelligence.types";

type OverviewPayload = PortfolioAnalysisResult;

type Props = { className?: string; compact?: boolean };

/**
 * Fetches `GET /api/brokerage-intelligence/overview` — broker/admin; advisory only.
 */
export function PortfolioDashboard({ className, compact = false }: Props) {
  const [data, setData] = useState<OverviewPayload | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    try {
      const res = await fetch("/api/brokerage-intelligence/overview", { credentials: "same-origin" });
      const j = (await res.json()) as { ok?: boolean; overview?: OverviewPayload; error?: string };
      if (j.ok && j.overview) setData(j.overview);
      else setErr(j.error ?? "Could not load");
    } catch {
      setErr("Could not load");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (err) {
    return (
      <div className={className}>
        <p className="text-sm text-rose-300">{err}</p>
        <button type="button" onClick={load} className="mt-1 text-xs text-amber-400">
          Retry
        </button>
      </div>
    );
  }
  if (!data) {
    return (
      <div className={className}>
        <p className="text-sm text-slate-500">Loading portfolio intelligence…</p>
      </div>
    );
  }
  const loadE = data.brokerLoadInsights as BrokerLoadEntry[];
  return (
    <section className={className} data-testid="portfolio-brokerage-dashboard">
      {!compact ? <h2 className="text-lg font-medium text-slate-200">Brokerage portfolio (advisory)</h2> : null}
      <p className="mt-1 text-xs text-slate-500">
        Lead routing, priorities, and load are suggestions. Irreversible assignments require explicit product actions and human confirmation where applicable.
      </p>
      {data.alerts.length > 0 ? (
        <ul className="mt-3 list-inside list-disc text-xs text-amber-200/90">
          {data.alerts.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
      ) : null}
      <div className={`mt-4 space-y-6 ${compact ? "" : "grid gap-4 lg:grid-cols-2"}`}>
        <BrokerLoadPanel load={loadE} rebalancing={data.loadRebalancing} className={compact ? "" : "lg:col-span-2"} />
        <SegmentInsightsPanel best={data.segmentInsights.best} weak={data.segmentInsights.weak} />
        <LeadRoutingPanel items={data.leadRoutingSuggestions} />
        <DealPriorityList items={data.dealPriorities} />
      </div>
    </section>
  );
}
