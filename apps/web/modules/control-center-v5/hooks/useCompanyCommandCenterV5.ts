"use client";

import { useCallback, useEffect, useState } from "react";
import type { CompanyCommandCenterV5Payload } from "../company-command-center-v5.types";

export type UseCompanyCommandCenterV5Options = {
  days?: number;
  limit?: number;
  offsetDays?: number;
  previousOffsetDays?: number;
  role?: string | null;
  presetId?: string | null;
  mode?: string | null;
  enabled?: boolean;
};

export function useCompanyCommandCenterV5(options: UseCompanyCommandCenterV5Options = {}) {
  const {
    days = 7,
    limit = 10,
    offsetDays = 0,
    previousOffsetDays = 1,
    role = null,
    presetId = null,
    mode = null,
    enabled = true,
  } = options;
  const [data, setData] = useState<CompanyCommandCenterV5Payload | null>(null);
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
      qs.set("previousOffsetDays", String(previousOffsetDays));
      if (role) qs.set("role", role);
      if (presetId) qs.set("presetId", presetId);
      if (mode) qs.set("mode", mode);
      const res = await fetch(`/api/admin/control-center-v5?${qs.toString()}`, { credentials: "same-origin" });
      if (res.status === 404) {
        setError("Company Command Center V5 is disabled.");
        setData(null);
        return;
      }
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setError(j.error ?? `HTTP ${res.status}`);
        setData(null);
        return;
      }
      setData((await res.json()) as CompanyCommandCenterV5Payload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [days, limit, offsetDays, previousOffsetDays, role, presetId, mode, enabled]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}
