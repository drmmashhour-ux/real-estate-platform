"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Funnel = {
  total: number;
  byStatus: Record<string, number>;
  bySource: Record<string, number>;
  stageLabels: Record<string, string>;
};

type LeaderboardRow = {
  referrerId: string;
  email: string | null;
  referralCode: string | null;
  totalReferrals: number;
  hostInvites: number;
};

export function GrowthCrmPanels() {
  const [funnel, setFunnel] = useState<Funnel | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [autoMsg, setAutoMsg] = useState<string | null>(null);
  const [autoLoading, setAutoLoading] = useState(false);
  const [lb, setLb] = useState<LeaderboardRow[]>([]);

  const loadFunnel = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/admin/growth-crm/funnel", { credentials: "same-origin" });
      if (!res.ok) throw new Error(await res.text());
      setFunnel((await res.json()) as Funnel);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed funnel");
    }
  }, []);

  const loadLb = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/referrals/leaderboard", { credentials: "same-origin" });
      if (!res.ok) return;
      const data = (await res.json()) as { rows: LeaderboardRow[] };
      setLb(data.rows ?? []);
    } catch {
      /* optional */
    }
  }, []);

  useEffect(() => {
    void loadFunnel();
    void loadLb();
  }, [loadFunnel, loadLb]);

  async function runAutomation(dryRun: boolean) {
    setAutoLoading(true);
    setAutoMsg(null);
    try {
      const res = await fetch(`/api/admin/growth-crm/automation?dryRun=${dryRun ? "1" : "0"}`, {
        method: "POST",
        credentials: "same-origin",
      });
      const data = (await res.json()) as {
        followUpsScheduled?: number;
        tiersSynced?: number;
        dryRun?: boolean;
      };
      if (!res.ok) throw new Error(JSON.stringify(data));
      setAutoMsg(
        `${data.dryRun ? "[Dry run] " : ""}Follow-ups: ${data.followUpsScheduled ?? 0}, tiers synced: ${data.tiersSynced ?? 0}`
      );
      if (!dryRun) void loadFunnel();
    } catch (e) {
      setAutoMsg(e instanceof Error ? e.message : "Automation failed");
    } finally {
      setAutoLoading(false);
    }
  }

  const order = ["CONTACTED", "REPLIED", "SIGNED_UP", "ONBOARDED"] as const;

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-slate-700 bg-slate-900/50 p-5">
        <h2 className="text-sm font-semibold text-slate-200">Conversion funnel (CRM)</h2>
        <p className="mt-1 text-xs text-slate-500">
          Status = pipeline stage (contacted → replied → signed → active). Source split helps attribute paid vs organic.
        </p>
        {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
        {funnel && (
          <div className="mt-4 space-y-3">
            <p className="text-xs text-slate-400">Total leads: {funnel.total}</p>
            <div className="flex flex-wrap gap-3">
              {order.map((k) => {
                const n = funnel.byStatus[k] ?? 0;
                const pct = funnel.total ? Math.round((n / funnel.total) * 100) : 0;
                return (
                  <div key={k} className="min-w-[140px] flex-1 rounded-lg border border-slate-700 bg-slate-950/80 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                      {funnel.stageLabels[k] ?? k}
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-white">{n}</p>
                    <p className="text-xs text-slate-500">{pct}%</p>
                    <div className="mt-2 h-1.5 overflow-hidden rounded bg-slate-800">
                      <div className="h-full bg-[#C9A646]/80" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4">
              <p className="text-xs font-medium uppercase text-slate-500">By source (top)</p>
              <ul className="mt-2 max-h-32 overflow-y-auto text-xs text-slate-400">
                {Object.entries(funnel.bySource)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 12)
                  .map(([src, n]) => (
                    <li key={src} className="flex justify-between border-b border-slate-800 py-1">
                      <span>{src}</span>
                      <span className="text-slate-300">{n}</span>
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-slate-700 bg-slate-900/50 p-5">
        <h2 className="text-sm font-semibold text-slate-200">Light automation</h2>
        <p className="mt-1 text-xs text-slate-500">
          Sets <code className="text-slate-400">followUpAt</code> for stale CONTACTED leads (36h+) using 24–48h spacing;
          syncs <code className="text-slate-400">leadTier</code> from <code className="text-slate-400">conversionScore</code>.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={autoLoading}
            onClick={() => void runAutomation(true)}
            className="rounded border border-slate-600 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 hover:border-[#C9A646]/40 disabled:opacity-50"
          >
            Dry run
          </button>
          <button
            type="button"
            disabled={autoLoading}
            onClick={() => void runAutomation(false)}
            className="rounded bg-[#C9A646] px-3 py-1.5 text-xs font-medium text-black disabled:opacity-50"
          >
            Run rules
          </button>
          <button
            type="button"
            onClick={() => void loadFunnel()}
            className="rounded border border-slate-600 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
          >
            Refresh funnel
          </button>
        </div>
        {autoMsg && <p className="mt-2 text-xs text-emerald-400/90">{autoMsg}</p>}
      </section>

      <section className="rounded-xl border border-slate-700 bg-slate-900/50 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-slate-200">Referral leaderboard</h2>
          <Link href="/admin/referrals" className="text-xs text-emerald-400 hover:text-emerald-300">
            Full referrals →
          </Link>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Host→host links: append <code className="text-slate-400">&amp;ref_kind=HOST</code> to signup URL (stored on{" "}
          <code className="text-slate-400">Referral.inviteKind</code>).
        </p>
        {lb.length === 0 ? (
          <p className="mt-3 text-xs text-slate-500">No referrals yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-xs text-slate-300">
              <thead className="border-b border-slate-700 text-slate-500">
                <tr>
                  <th className="py-2 pr-2">User</th>
                  <th className="py-2 pr-2">Code</th>
                  <th className="py-2 pr-2">Total</th>
                  <th className="py-2">Host invites</th>
                </tr>
              </thead>
              <tbody>
                {lb.map((r) => (
                  <tr key={r.referrerId} className="border-b border-slate-800">
                    <td className="py-2 pr-2">{r.email ?? r.referrerId.slice(0, 8)}</td>
                    <td className="font-mono text-slate-400">{r.referralCode ?? "—"}</td>
                    <td>{r.totalReferrals}</td>
                    <td>{r.hostInvites}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
