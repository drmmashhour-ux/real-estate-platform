"use client";

import { useCallback, useEffect, useState } from "react";

import type { LecipmTrustOperationalBand } from "@/types/trust-enums-client";

import { TrustImprovementPanel } from "./TrustImprovementPanel";
import { TrustScoreCard } from "./TrustScoreCard";

type Payload = {
  snapshot: {
    trustScore: number;
    trustBand: LecipmTrustOperationalBand;
    deltaFromPrior: number | null;
    explain: { improvements: string[]; bandReason?: string };
  };
  advisoryFooter?: string;
};

/** Signed-in broker operational trust via `/api/broker/trust-score`. */
export function BrokerOperationalTrustPanel() {
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/broker/trust-score", { credentials: "include" });
      const j = (await res.json().catch(() => ({}))) as Payload & { error?: string };
      if (!res.ok) {
        setError(j?.error ?? "unavailable");
        setData(null);
        return;
      }
      setData(j);
    } catch {
      setError("network_error");
      setData(null);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (error) {
    return (
      <p className="rounded-lg border border-amber-500/30 bg-amber-950/20 px-3 py-2 text-xs text-amber-100">
        Operational trust summary unavailable ({error}).
      </p>
    );
  }
  if (!data?.snapshot) {
    return <p className="text-xs text-gray-500">Loading operational trust…</p>;
  }

  const s = data.snapshot;
  return (
    <div className="space-y-4">
      <TrustScoreCard
        score={s.trustScore}
        band={s.trustBand}
        deltaFromPrior={s.deltaFromPrior}
        subtitle={s.explain?.bandReason}
      />
      <TrustImprovementPanel items={s.explain?.improvements ?? []} />
      {data.advisoryFooter ?
        <p className="text-[11px] text-gray-500">{data.advisoryFooter}</p>
      : null}
    </div>
  );
}
