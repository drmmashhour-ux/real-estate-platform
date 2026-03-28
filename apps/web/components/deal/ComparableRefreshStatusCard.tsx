"use client";

import { useCallback, useEffect, useState } from "react";
import type { RefreshStatusPublicDto } from "@/modules/deal-analyzer/domain/contracts";

type Props = {
  listingId: string;
  enabled: boolean;
};

export function ComparableRefreshStatusCard({ listingId, enabled }: Props) {
  const [dto, setDto] = useState<RefreshStatusPublicDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/deal-analyzer/properties/${encodeURIComponent(listingId)}/refresh-status`, {
      credentials: "include",
    });
    if (res.status === 503) return;
    if (!res.ok) return;
    const j = (await res.json()) as { refreshStatus?: RefreshStatusPublicDto };
    setDto(j.refreshStatus ?? null);
  }, [listingId]);

  useEffect(() => {
    if (!enabled) return;
    void load();
  }, [enabled, load]);

  async function runRefresh() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/deal-analyzer/properties/${encodeURIComponent(listingId)}/refresh`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force: true }),
      });
      const j = (await res.json()) as { error?: string; reasons?: string[]; ok?: boolean };
      if (res.status === 409) {
        setErr(j.reasons?.[0] ?? "Refresh not needed right now.");
        await load();
        return;
      }
      if (!res.ok) {
        setErr(j.error ?? "Could not refresh comparables");
        return;
      }
      await load();
    } catch {
      setErr("Network error");
    } finally {
      setLoading(false);
    }
  }

  if (!enabled) return null;

  return (
    <div className="rounded-2xl border border-premium-gold/25 bg-[#121212] p-5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-premium-gold">Comparable refresh</p>
      <p className="mt-2 text-xs text-slate-500">
        Refreshes rules-based comparables — not an appraisal. Staleness and list-price changes can prompt updates.
      </p>
      <button
        type="button"
        onClick={() => void runRefresh()}
        disabled={loading}
        className="mt-4 rounded-full border border-premium-gold/40 bg-premium-gold/10 px-4 py-2 text-xs font-semibold text-premium-gold transition hover:bg-premium-gold/20 disabled:opacity-50"
      >
        {loading ? "Running…" : "Request comparable refresh"}
      </button>
      {err ? <p className="mt-2 text-xs text-amber-200/80">{err}</p> : null}
      {dto ? (
        <div className="mt-4 space-y-2 text-sm text-slate-300">
          <p>
            <span className="text-slate-500">Last refresh:</span>{" "}
            <span className="text-white">
              {dto.lastComparableRefreshAt ? new Date(dto.lastComparableRefreshAt).toLocaleString() : "—"}
            </span>
          </p>
          <p>
            <span className="text-slate-500">Regional profile:</span>{" "}
            <span className="text-white">{dto.regionalProfileKey?.replace(/_/g, " ") ?? "—"}</span>
          </p>
          {dto.pendingJobs.length > 0 ? (
            <p className="text-xs text-amber-200/80">
              {dto.pendingJobs.length} job(s) pending or running.
            </p>
          ) : null}
          {dto.evaluateReasons.length > 0 ? (
            <ul className="list-inside list-disc text-xs text-slate-500">
              {dto.evaluateReasons.map((r) => (
                <li key={r.slice(0, 64)}>{r}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : (
        <p className="mt-4 text-xs text-slate-500">Loading status…</p>
      )}
    </div>
  );
}
