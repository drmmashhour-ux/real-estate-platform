"use client";

import { useCallback, useEffect, useState } from "react";
import type { CompanyCommandCenterV3Payload } from "../company-command-center-v3.types";

export type UseCompanyCommandCenterV3Options = {
  days?: number;
  limit?: number;
  offsetDays?: number;
  /** Optional API filter — refetch when role changes only if you pass role to API. */
  role?: string | null;
  enabled?: boolean;
};

export function useCompanyCommandCenterV3(options: UseCompanyCommandCenterV3Options = {}) {
  const { days = 7, limit = 10, offsetDays = 0, role = null, enabled = true } = options;
  const [data, setData] = useState<CompanyCommandCenterV3Payload | null>(null);
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
      if (role) qs.set("role", role);
      const res = await fetch(`/api/admin/control-center-v3?${qs.toString()}`, { credentials: "same-origin" });
      if (res.status === 404) {
        setError("Company Command Center V3 is disabled.");
        setData(null);
        return;
      }
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setError(j.error ?? `HTTP ${res.status}`);
        setData(null);
        return;
      }
      setData((await res.json()) as CompanyCommandCenterV3Payload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [days, limit, offsetDays, role, enabled]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}
