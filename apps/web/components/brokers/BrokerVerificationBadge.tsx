"use client";

import { useEffect, useState } from "react";

type BadgePayload = {
  enabled: boolean;
  badge: {
    state: "verified" | "pending_review" | "incomplete" | "not_eligible";
    label: string;
    trustScore: number | null;
  } | null;
};

export function BrokerVerificationBadge() {
  const [data, setData] = useState<BadgePayload | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/trustgraph/broker/me/badge", { credentials: "include" })
      .then(async (res) => {
        const j = (await res.json()) as BadgePayload & { error?: string };
        if (!res.ok) throw new Error(typeof j.error === "string" ? j.error : "Unavailable");
        return j;
      })
      .then((j) => {
        if (!cancelled) setData(j);
      })
      .catch((e: unknown) => {
        if (!cancelled) setErr(e instanceof Error ? e.message : "Failed");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (err) {
    return <p className="text-xs text-slate-500">{err}</p>;
  }
  if (!data?.enabled || !data.badge) {
    return null;
  }

  const b = data.badge;
  const tone =
    b.state === "verified"
      ? "border-emerald-500/40 bg-emerald-950/30 text-emerald-100"
      : b.state === "pending_review"
        ? "border-amber-500/35 bg-amber-950/25 text-amber-100"
        : "border-white/15 bg-slate-900/50 text-slate-200";

  return (
    <div className={`rounded-xl border px-3 py-2 text-sm ${tone}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Broker verification</p>
      <p className="mt-1 font-medium">{b.label}</p>
      {b.trustScore != null ? <p className="mt-0.5 text-xs text-slate-400">Trust score: {b.trustScore}</p> : null}
    </div>
  );
}
