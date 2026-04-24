"use client";

import * as React from "react";

type Props = {
  leadId: string;
  className?: string;
  label?: string;
  /** When set, POST /api/lecipm/leads/unlock (requires FEATURE_LEAD_MONETIZATION_V1). Otherwise legacy unlock-checkout. */
  useMonetizationUnlockApi?: boolean;
};

export function LeadUnlockButton({
  leadId,
  className = "",
  label = "Unlock lead",
  useMonetizationUnlockApi = true,
}: Props) {
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  const onClick = async () => {
    if (!leadId || loading) return;
    if (!window.confirm("Continue to secure checkout to unlock full contact details for this lead?")) return;
    setErr(null);
    setLoading(true);
    try {
      const url = useMonetizationUnlockApi ? "/api/lecipm/leads/unlock" : `/api/lecipm/leads/${encodeURIComponent(leadId)}/unlock-checkout`;
      const init: RequestInit =
        useMonetizationUnlockApi ?
          {
            method: "POST",
            credentials: "same-origin",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ leadId }),
          }
        : { method: "POST", credentials: "same-origin" };

      const res = await fetch(url, init);
      const data = (await res.json()) as {
        url?: string;
        error?: string;
        softBlock?: boolean;
        message?: string;
      };
      if (!res.ok) {
        setErr(data.error ?? "Unlock failed");
        return;
      }
      if (data.softBlock && data.message) {
        setErr(data.message);
        return;
      }
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setErr("No checkout URL returned");
    } catch {
      setErr("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={() => void onClick()}
        disabled={loading}
        className={`inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-sm transition hover:from-amber-400 hover:to-amber-500 disabled:opacity-60 ${className}`}
      >
        {loading ? "Redirecting…" : label}
      </button>
      {err ? <p className="text-xs text-rose-400">{err}</p> : null}
    </div>
  );
}
