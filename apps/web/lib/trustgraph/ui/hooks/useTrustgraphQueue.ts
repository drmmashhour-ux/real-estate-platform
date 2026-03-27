"use client";

import { useCallback, useEffect, useState } from "react";

export type TrustgraphQueueResponse = {
  total: number;
  page: number;
  pageSize: number;
  items: Array<{
    id: string;
    entityType: string;
    entityId: string;
    status: string;
    overallScore: number | null;
    trustLevel: string | null;
    readinessLevel: string | null;
    topSeverity: string | null;
    assignedTo: string | null;
    updatedAt: string;
  }>;
};

export function useTrustgraphQueue(searchParams: URLSearchParams) {
  const [data, setData] = useState<TrustgraphQueueResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const qs = searchParams.toString();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/trustgraph/queue?${qs}`, { credentials: "include" });
      const json = (await res.json().catch(() => ({}))) as TrustgraphQueueResponse & { error?: string };
      if (!res.ok) {
        setError(typeof json.error === "string" ? json.error : "Failed to load queue");
        setData(null);
        return;
      }
      setData(json);
    } catch {
      setError("Network error");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [qs]);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, error, loading, reload: load };
}
