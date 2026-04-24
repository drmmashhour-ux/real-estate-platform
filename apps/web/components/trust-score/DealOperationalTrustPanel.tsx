"use client";

import { useCallback, useEffect, useState } from "react";

import type { LecipmTrustOperationalBand } from "@prisma/client";

import { TrustFactorList } from "./TrustFactorList";
import { TrustHistoryChart, type TrustHistoryChartPoint } from "./TrustHistoryChart";
import { TrustImprovementPanel } from "./TrustImprovementPanel";
import { TrustScoreCard } from "./TrustScoreCard";

type Detail = {
  snapshot: {
    trustScore: number;
    trustBand: LecipmTrustOperationalBand;
    deltaFromPrior: number | null;
    explain: {
      topPositive: string[];
      topNegative: string[];
      improvements: string[];
      bandReason?: string;
    };
  };
  history: Array<{ trustScore: number; createdAt: string }>;
  advisoryFooter?: string;
};

export function DealOperationalTrustPanel(props: { dealId: string }) {
  const [data, setData] = useState<Detail | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(`/api/broker/residential/deals/${props.dealId}/trust-score`, {
        credentials: "include",
      });
      const j = (await res.json().catch(() => ({}))) as Detail & { error?: string };
      if (!res.ok) {
        setError(j?.error ?? "failed");
        setData(null);
        return;
      }
      setData(j);
    } catch {
      setError("network_error");
      setData(null);
    }
  }, [props.dealId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (error) {
    return <p className="text-xs text-ds-text-secondary">Operational trust unavailable ({error}).</p>;
  }
  if (!data?.snapshot) {
    return <p className="text-xs text-ds-text-secondary">Loading operational trust…</p>;
  }

  const s = data.snapshot;
  const chartPoints: TrustHistoryChartPoint[] = (data.history ?? []).map((h) => ({
    at: h.createdAt,
    score: h.trustScore,
  }));

  return (
    <section className="rounded-2xl border border-ds-border bg-ds-card/60 p-5 shadow-ds-soft">
      <h3 className="font-medium text-ds-text">Operational trust (deal file)</h3>
      <p className="mt-1 text-xs text-ds-text-secondary">
        Advisory prioritization signal — combine with deal intelligence and compliance workflows.
      </p>
      <div className="mt-4 space-y-4">
        <TrustScoreCard
          score={s.trustScore}
          band={s.trustBand}
          deltaFromPrior={s.deltaFromPrior}
          subtitle={s.explain?.bandReason}
        />
        <div className="grid gap-4 md:grid-cols-2">
          <TrustFactorList title="Positive contributors" items={s.explain?.topPositive ?? []} variant="positive" />
          <TrustFactorList title="Friction contributors" items={s.explain?.topNegative ?? []} variant="negative" />
        </div>
        <TrustImprovementPanel items={s.explain?.improvements ?? []} />
        <TrustHistoryChart points={chartPoints} />
        {data.advisoryFooter ?
          <p className="text-[11px] text-ds-text-secondary">{data.advisoryFooter}</p>
        : null}
      </div>
    </section>
  );
}
