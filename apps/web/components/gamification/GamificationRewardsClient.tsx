"use client";

import { useCallback, useEffect, useState } from "react";

type Reward = {
  id: string;
  rewardType: string;
  status: string;
  createdAt: string;
  redeemedAt: string | null;
};

export function GamificationRewardsClient() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    try {
      const res = await fetch("/api/gamification/me", { credentials: "same-origin" });
      const j = (await res.json()) as { ok?: boolean; rewards?: Reward[] };
      if (j.rewards) setRewards(j.rewards);
      if (!j.ok) setErr("load_failed");
    } catch {
      setErr("load_failed");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function redeem(id: string) {
    setBusy(id);
    setErr(null);
    try {
      const res = await fetch(`/api/gamification/rewards/${id}/redeem`, {
        method: "POST",
        credentials: "same-origin",
      });
      const j = (await res.json()) as { ok?: boolean };
      if (!j.ok) setErr("redeem_failed");
      await load();
    } finally {
      setBusy(null);
    }
  }

  const available = rewards.filter((r) => r.status === "AVAILABLE");
  const redeemed = rewards.filter((r) => r.status === "REDEEMED");

  return (
    <div className="space-y-8">
      {err ? <p className="text-xs text-rose-400">{err}</p> : null}

      <section>
        <h3 className="text-sm font-semibold text-white">Available</h3>
        <ul className="mt-3 space-y-2">
          {available.map((r) => (
            <li
              key={r.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-emerald-500/20 bg-emerald-950/15 px-4 py-3 text-xs"
            >
              <span className="text-slate-200">
                {r.rewardType.replace(/_/g, " ")}
                <span className="ml-2 text-slate-500">{new Date(r.createdAt).toLocaleDateString()}</span>
              </span>
              <button
                type="button"
                disabled={busy === r.id}
                onClick={() => void redeem(r.id)}
                className="rounded-lg bg-emerald-600/80 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-emerald-500 disabled:opacity-40"
              >
                Redeem
              </button>
            </li>
          ))}
          {available.length === 0 ?
            <li className="text-xs text-slate-500">No rewards available — climb the monthly board.</li>
          : null}
        </ul>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-white">Redeemed</h3>
        <ul className="mt-3 space-y-2 text-xs text-slate-500">
          {redeemed.map((r) => (
            <li key={r.id}>
              {r.rewardType.replace(/_/g, " ")} · {r.redeemedAt ? new Date(r.redeemedAt).toLocaleString() : "—"}
            </li>
          ))}
          {redeemed.length === 0 ?
            <li>None yet.</li>
          : null}
        </ul>
      </section>
    </div>
  );
}
