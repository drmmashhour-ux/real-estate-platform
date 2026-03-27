"use client";

import { useCallback, useEffect, useState } from "react";

type OverviewState = {
  data: Record<string, unknown> | null;
  error: string | null;
  loading: boolean;
  refresh: () => void;
};

/** Admin dashboard: fetch `/api/admin/bnhub-growth/overview` (session cookie). */
export function useBnhubGrowthAdminOverview(): OverviewState {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setLoading(true);
    setError(null);
    void (async () => {
      const r = await fetch("/api/admin/bnhub-growth/overview");
      const j = (await r.json()) as Record<string, unknown> & { error?: string };
      if (!r.ok) setError(j.error ?? "Failed");
      else setData(j);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, error, loading, refresh };
}
