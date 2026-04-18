"use client";

import { useCallback, useEffect, useState } from "react";
import type { CompanyCommandCenterV2Payload } from "../company-command-center-v2.types";

export type UseCompanyCommandCenterV2Options = {
  days?: number;
  limit?: number;
  offsetDays?: number;
  enabled?: boolean;
};

export function useCompanyCommandCenterV2(options: UseCompanyCommandCenterV2Options = {}) {
  const { days = 7, limit = 10, offsetDays = 0, enabled = true } = options;
  const [data, setData] = useState<CompanyCommandCenterV2Payload | null>(null);
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
      const res = await fetch(`/api/admin/control-center-v2?${qs.toString()}`, { credentials: "same-origin" });
      if (res.status === 404) {
        setError("Company Command Center V2 is disabled.");
        setData(null);
        return;
      }
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setError(j.error ?? `HTTP ${res.status}`);
        setData(null);
        return;
      }
      setData((await res.json()) as CompanyCommandCenterV2Payload);
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
