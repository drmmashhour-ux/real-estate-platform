"use client";

import { useCallback, useEffect, useState } from "react";

export function useTrustgraphCase(caseId: string | null) {
  const [data, setData] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!!caseId);

  const load = useCallback(async () => {
    if (!caseId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/trustgraph/cases/${encodeURIComponent(caseId)}`, { credentials: "include" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof (json as { error?: string }).error === "string" ? (json as { error: string }).error : "Failed");
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
  }, [caseId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, error, loading, reload: load };
}
