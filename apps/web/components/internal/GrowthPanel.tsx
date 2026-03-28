"use client";

import { useEffect, useState } from "react";

export function GrowthPanel({ className }: { className?: string }) {
  const [data, setData] = useState<{
    recent: { id: string; userId: string; triggerKey: string; subject: string | null; createdAt: string }[];
    triggersFired: { triggerKey: string; count: number }[];
    totalEmailsLogged: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [runMsg, setRunMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/internal/growth", { credentials: "include" });
        const j = await res.json();
        if (!res.ok) {
          setError((j as { error?: string }).error ?? `HTTP ${res.status}`);
          return;
        }
        if (!cancelled) setData(j as typeof data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function runBatch() {
    setRunMsg(null);
    try {
      const res = await fetch("/api/internal/growth", { method: "POST", credentials: "include" });
      const j = (await res.json()) as { sent?: number; skipped?: number; failed?: number; error?: string };
      if (!res.ok) {
        setRunMsg(j.error ?? "Run failed");
        return;
      }
      setRunMsg(`Sent ${j.sent ?? 0}, skipped ${j.skipped ?? 0}, failed ${j.failed ?? 0}`);
      const refresh = await fetch("/api/internal/growth", { credentials: "include" });
      if (refresh.ok) setData((await refresh.json()) as typeof data);
    } catch (e) {
      setRunMsg(e instanceof Error ? e.message : "Run failed");
    }
  }

  if (loading) {
    return <div className={`rounded-xl border border-white/10 bg-[#0f0f0f] p-6 text-sm text-slate-400 ${className ?? ""}`}>Loading growth…</div>;
  }
  if (error) {
    return (
      <div className={`rounded-xl border border-amber-500/30 bg-amber-950/20 p-6 text-sm text-amber-200 ${className ?? ""}`}>
        Growth stats unavailable: {error}
      </div>
    );
  }
  if (!data) return null;

  return (
    <div className={`rounded-xl border border-white/10 bg-[#0f0f0f] p-6 ${className ?? ""}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-premium-gold/90">Growth automation</h2>
        <button
          type="button"
          onClick={() => void runBatch()}
          className="rounded-lg border border-premium-gold/50 bg-premium-gold/10 px-3 py-1.5 text-xs font-semibold text-premium-gold hover:bg-premium-gold/20"
        >
          Run batch now
        </button>
      </div>
      {runMsg ? <p className="mt-2 text-xs text-emerald-300">{runMsg}</p> : null}
      <p className="mt-3 text-xs text-slate-500">Total emails logged (idempotent): {data.totalEmailsLogged}</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <p className="text-xs font-medium uppercase text-slate-500">By trigger</p>
          <ul className="mt-2 space-y-1 text-sm text-slate-300">
            {data.triggersFired.map((t) => (
              <li key={t.triggerKey}>
                <span className="text-slate-500">{t.triggerKey}</span> — {t.count}
              </li>
            ))}
            {data.triggersFired.length === 0 ? <li className="text-slate-600">No sends yet.</li> : null}
          </ul>
        </div>
        <div>
          <p className="text-xs font-medium uppercase text-slate-500">Recent</p>
          <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto text-xs text-slate-400">
            {data.recent.slice(0, 8).map((r) => (
              <li key={r.id}>
                {r.triggerKey} · {new Date(r.createdAt).toISOString().slice(0, 10)}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
