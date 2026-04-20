"use client";

import { useCallback, useEffect, useState } from "react";

type ItemRow = {
  id: string;
  key: string;
  label: string;
  status: "PENDING" | "COMPLETED";
  required: boolean;
};

type CompliancePayload = {
  applies: boolean;
  listingType: string;
  isCoOwnership: boolean;
  items: ItemRow[];
  complete: boolean;
  certificateComplete: boolean;
};

type Props = {
  listingId: string;
  className?: string;
  showRegulationBanner?: boolean;
  showAiRecommendation?: boolean;
  /** When set, `router.refresh()` after checklist changes (RSC data). */
  refreshRouter?: boolean;
  onComplianceLoaded?: (payload: CoOwnershipCompliancePayload) => void;
};

export function CoOwnershipChecklist({
  listingId,
  className = "",
  showRegulationBanner = true,
  showAiRecommendation = true,
  refreshRouter = false,
  onComplianceLoaded,
}: Props) {
  const router = useRouter();
  const [data, setData] = useState<CompliancePayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!listingId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/compliance/${encodeURIComponent(listingId)}`, { credentials: "same-origin" });
      const j = (await res.json().catch(() => ({}))) as CoOwnershipCompliancePayload & { error?: string };
      if (!res.ok) {
        setError(j.error ?? "Could not load compliance");
        setData(null);
        return;
      }
      setData(j);
    } catch {
      setError("Network error");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [listingId]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggle = async (key: string, nextCompleted: boolean) => {
    if (!nextCompleted) return;
    setUpdating(key);
    setError(null);
    try {
      const res = await fetch(`/api/compliance/${encodeURIComponent(listingId)}/check/${encodeURIComponent(key)}`, {
        method: "POST",
        credentials: "same-origin",
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof j.error === "string" ? j.error : "Update failed");
        return;
      }
      await load();
    } catch {
      setError("Network error");
    } finally {
      setUpdating(null);
    }
  };

  if (loading && !data) {
    return (
      <div className={`rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400 ${className}`}>
        Loading co-ownership compliance…
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className={`rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200 ${className}`}>
        {error}
      </div>
    );
  }

  if (!data || !data.applies) {
    return null;
  }

  const showRegBanner = showRegulationBanner && data.listingType === "CONDO";

  return (
    <div className={`space-y-4 ${className}`}>
      {showRegBanner ? (
        <div className="rounded-xl border border-amber-300/80 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-100">
          <p className="font-semibold">⚠️ New Regulation (Aug 14, 2025)</p>
          <p className="mt-2">
            You must obtain the certificate of co-ownership condition before sale.
          </p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-amber-900/95 dark:text-amber-100/90">
            <li>Mandatory for all divided co-ownerships</li>
            <li>Must be provided to buyer</li>
            <li>Syndicate has 15 days to issue it</li>
          </ul>
        </div>
      ) : null}

      {showAiRecommendation ? (
        <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-950 dark:border-sky-800 dark:bg-sky-950/30 dark:text-sky-100">
          <p className="font-medium">💡 Recommendation</p>
          <p className="mt-2 leading-relaxed">
            This property is a divided co-ownership. We recommend requesting the certificate from the syndicate immediately to avoid delays and ensure compliance.
          </p>
        </div>
      ) : null}

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">Co-ownership Compliance</h2>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
              data.complete
                ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100"
                : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
            }`}
          >
            {data.complete ? "Complete" : "In progress"}
          </span>
        </div>

        {error ? <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p> : null}

        <ul className="mt-4 space-y-3">
          {data.items.map((item) => {
            const done = item.status === "COMPLETED";
            const busy = updating === item.key;
            return (
              <li key={item.id} className="flex gap-3 text-sm">
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500 dark:border-slate-600 dark:bg-slate-900"
                    checked={done}
                    disabled={busy || done}
                    onChange={(e) => void toggle(item.key, e.target.checked)}
                  />
                  <span className="flex-1 leading-snug text-slate-800 dark:text-slate-100">{item.label}</span>
                </label>
                <span className="shrink-0 text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {done ? "Done" : "Pending"}
                </span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
