"use client";

import { useCallback, useEffect, useState } from "react";
import type { RankingV8GovernancePayload } from "./ranking-v8-governance.types";

export type UseRankingV8GovernanceOptions = {
  days?: number;
  limit?: number;
  offsetDays?: number;
  /** When false, skips network (caller should hide UI). */
  enabled?: boolean;
};

export function useRankingV8Governance(options: UseRankingV8GovernanceOptions = {}) {
  const { days = 7, limit = 10, offsetDays = 0, enabled = true } = options;
  const [data, setData] = useState<RankingV8GovernancePayload | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      setData(null);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams();
      qs.set("days", String(days));
      qs.set("limit", String(limit));
      qs.set("offsetDays", String(offsetDays));
      const res = await fetch(`/api/admin/ranking/v8/governance?${qs.toString()}`, {
        credentials: "same-origin",
      });
      if (res.status === 404) {
        setError("Governance dashboard is disabled.");
        setData(null);
        return;
      }
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setError(j.error ?? `HTTP ${res.status}`);
        setData(null);
        return;
      }
      setData((await res.json()) as RankingV8GovernancePayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [days, limit, offsetDays, enabled]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}
