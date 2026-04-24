"use client";

import { useCallback, useEffect, useState } from "react";

import type { LecipmTrustEngineTargetType, LecipmTrustOperationalBand } from "@prisma/client";

import { TrustFactorList } from "./TrustFactorList";
import { TrustHistoryChart, type TrustHistoryChartPoint } from "./TrustHistoryChart";
import { TrustImprovementPanel } from "./TrustImprovementPanel";
import { TrustScoreCard } from "./TrustScoreCard";

type SnapshotPayload = {
  trustScore: number;
  trustBand: LecipmTrustOperationalBand;
  deltaFromPrior: number | null;
  explain: {
    topPositive: string[];
    topNegative: string[];
    bandReason: string;
    improvements: string[];
    declineNote?: string;
  };
};

type DetailResponse = {
  snapshot: SnapshotPayload;
  history: Array<{ trustScore: number; createdAt: string }>;
  advisoryFooter?: string;
};

/** Admin-authenticated fetch of operational trust for dispute rooms / admin surfaces. */
export function OperationalTrustEntityPanel(props: {
  targetType: LecipmTrustEngineTargetType;
  targetId: string;
}) {
  const [data, setData] = useState<DetailResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/trust-score/target/${props.targetType}/${encodeURIComponent(props.targetId)}`,
        { credentials: "include" },
      );
      const j = (await res.json().catch(() => ({}))) as DetailResponse & { error?: string };
      if (!res.ok) {
        setError(j?.error ?? "load_failed");
        setData(null);
        return;
      }
      setData(j);
    } catch {
      setError("network_error");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [props.targetId, props.targetType]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <p className="text-xs text-ds-text-secondary">Loading operational trust…</p>;
  }
  if (error || !data?.snapshot) {
    return (
      <p className="rounded-lg border border-ds-border/60 bg-black/40 px-3 py-2 text-xs text-ds-text-secondary">
        Operational trust unavailable ({error ?? "unknown"}).
      </p>
    );
  }

  const s = data.snapshot;
  const chartPoints: TrustHistoryChartPoint[] = (data.history ?? []).map((h) => ({
    at: h.createdAt,
    score: h.trustScore,
  }));

  return (
    <div className="space-y-4 rounded-2xl border border-ds-border bg-black/35 p-4">
      <TrustScoreCard
        score={s.trustScore}
        band={s.trustBand}
        deltaFromPrior={s.deltaFromPrior}
        subtitle={s.explain?.bandReason}
      />
      <div className="grid gap-4 md:grid-cols-2">
        <TrustFactorList title="Top contributors" items={s.explain?.topPositive ?? []} variant="positive" />
        <TrustFactorList title="Main drag factors" items={s.explain?.topNegative ?? []} variant="negative" />
      </div>
      {s.explain?.declineNote ?
        <p className="text-xs text-amber-100/90">{s.explain.declineNote}</p>
      : null}
      <TrustImprovementPanel items={s.explain?.improvements ?? []} />
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ds-gold/90">Recent scores</p>
        <TrustHistoryChart points={chartPoints} />
      </div>
      {data.advisoryFooter ?
        <p className="text-[11px] leading-relaxed text-ds-text-secondary">{data.advisoryFooter}</p>
      : null}
    </div>
  );
}
