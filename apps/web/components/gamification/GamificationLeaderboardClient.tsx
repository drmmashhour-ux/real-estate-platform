"use client";

import { useCallback, useEffect, useState } from "react";

type Row = {
  rank: number;
  brokerId: string;
  displayName: string | null;
  normalizedScore: number;
  level: string;
  city: string | null;
};

export function GamificationLeaderboardClient() {
  const [scope, setScope] = useState<"GLOBAL" | "CITY">("GLOBAL");
  const [window, setWindow] = useState<"WEEKLY" | "MONTHLY" | "ALL_TIME">("MONTHLY");
  const [city, setCity] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    const params = new URLSearchParams({
      scope,
      window,
      take: "60",
    });
    if (scope === "CITY" && city.trim()) params.set("city", city.trim());

    try {
      const res = await fetch(`/api/gamification/leaderboard?${params}`, { credentials: "same-origin" });
      const j = (await res.json()) as { ok?: boolean; rows?: Row[] };
      if (j.rows) setRows(j.rows);
      if (!j.ok) setErr("load_failed");
    } catch {
      setErr("load_failed");
    }
  }, [scope, window, city]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <label className="text-xs text-slate-400">
          Window{" "}
          <select
            value={window}
            onChange={(e) => setWindow(e.target.value as typeof window)}
            className="ml-2 rounded border border-white/15 bg-black/40 px-2 py-1 text-slate-200"
          >
            <option value="WEEKLY">Weekly</option>
            <option value="MONTHLY">Monthly</option>
            <option value="ALL_TIME">All-time</option>
          </select>
        </label>
        <label className="text-xs text-slate-400">
          Board{" "}
          <select
            value={scope}
            onChange={(e) => setScope(e.target.value as typeof scope)}
            className="ml-2 rounded border border-white/15 bg-black/40 px-2 py-1 text-slate-200"
          >
            <option value="GLOBAL">Global</option>
            <option value="CITY">City</option>
          </select>
        </label>
        {scope === "CITY" ?
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="City name"
            className="rounded border border-white/15 bg-black/40 px-3 py-1 text-sm text-white placeholder:text-slate-600"
          />
        : null}
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-lg border border-violet-500/40 px-3 py-1 text-xs font-semibold text-violet-100"
        >
          Apply
        </button>
      </div>

      {err ? <p className="text-xs text-rose-400">{err}</p> : null}

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full min-w-[540px] text-left text-xs text-slate-300">
          <thead className="border-b border-white/10 text-[10px] uppercase text-slate-500">
            <tr>
              <th className="px-3 py-2">#</th>
              <th className="px-3 py-2">Broker</th>
              <th className="px-3 py-2">Score</th>
              <th className="px-3 py-2">Level</th>
              <th className="px-3 py-2">City</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.brokerId} className="border-b border-white/5">
                <td className="px-3 py-2 font-mono text-slate-500">{r.rank}</td>
                <td className="px-3 py-2 text-slate-100">{r.displayName ?? r.brokerId.slice(0, 8)}</td>
                <td className="px-3 py-2">{r.normalizedScore.toFixed(1)}</td>
                <td className="px-3 py-2">{r.level}</td>
                <td className="px-3 py-2 text-slate-500">{r.city ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
