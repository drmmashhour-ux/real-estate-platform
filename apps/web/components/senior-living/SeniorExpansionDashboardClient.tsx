"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Tier = "admin" | "growth";

type ExpansionSuggestion = { cityId: string; cityName: string; message: string; severity: "info" | "warn" };

type ExpansionCityRow = {
  id: string;
  name: string;
  country: string;
  status: string;
  operatorCount: number;
  leadCount: number;
  readinessScore: number | null;
  expansionClonedFromCity: string | null;
  progressPct: number;
  nextTasks: Array<{ id: string; taskType: string; status: string }>;
  tasks: Array<{ id: string; taskType: string; status: string }>;
};

type Overview = { cities: ExpansionCityRow[]; suggestions: ExpansionSuggestion[] };

const TASK_LABEL: Record<string, string> = {
  ONBOARD_OPERATORS: "Onboard ~10 operators (referrals + manual)",
  ACTIVATE_DEMAND: "Activate demand (DM + content)",
  SEND_FIRST_LEADS: "Send / route first leads",
  VALIDATE_CONVERSION: "Monitor & validate conversion",
  ACTIVATE_PRICING: "Activate market pricing",
};

function statusPillClass(status: string): string {
  const s = status.toUpperCase();
  if (s === "DOMINANT") return "bg-violet-500/20 text-violet-200 ring-violet-500/30";
  if (s === "ACTIVE") return "bg-emerald-500/20 text-emerald-200 ring-emerald-500/30";
  if (s === "TESTING") return "bg-amber-500/15 text-amber-200 ring-amber-500/30";
  if (s === "LOCKED") return "bg-slate-700/50 text-slate-400 ring-slate-600/40";
  return "bg-slate-800 text-slate-300";
}

export function SeniorExpansionDashboardClient(props: {
  locale: string;
  countrySlug: string;
  countryFilter: string;
  tier: Tier;
}) {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cloneBusy, setCloneBusy] = useState(false);
  const [sourceId, setSourceId] = useState<string>("");
  const [targetId, setTargetId] = useState<string>("");
  const [applyGlobals, setApplyGlobals] = useState(false);
  const seededCloneIds = useRef(false);

  const load = useCallback(
    async (withMetricsRefresh: boolean) => {
      setError(null);
      if (withMetricsRefresh) setRefreshing(true);
      else setLoading(true);
      try {
        const q = new URLSearchParams();
        if (props.countryFilter) q.set("country", props.countryFilter);
        if (withMetricsRefresh) q.set("refresh", "1");
        const res = await fetch(`/api/senior/expansion/overview?${q.toString()}`, {
          credentials: "same-origin",
        });
        if (!res.ok) {
          const j = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(j.error ?? `HTTP ${res.status}`);
        }
        const json = (await res.json()) as Overview;
        setData(json);
        if (!seededCloneIds.current && json.cities.length > 0) {
          seededCloneIds.current = true;
          setSourceId(json.cities[0].id);
          if (json.cities.length > 1) setTargetId(json.cities[1].id);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [props.countryFilter],
  );

  useEffect(() => {
    seededCloneIds.current = false;
    load(false);
  }, [props.countryFilter, load]);

  async function markTask(taskId: string, status: "DONE" | "PENDING") {
    const res = await fetch(`/api/senior/expansion/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error("Task update failed");
    await load(false);
  }

  async function runClone() {
    if (!sourceId || !targetId || sourceId === targetId) return;
    setCloneBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/senior/expansion/clone`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          sourceCityId: sourceId,
          targetCityId: targetId,
          applyGlobalWeights: props.tier === "admin" ? applyGlobals : false,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((json as { error?: string }).error ?? "Clone failed");
      await load(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Clone failed");
    } finally {
      setCloneBusy(false);
    }
  }

  const dashBase = `/${props.locale}/${props.countrySlug}/dashboard`;

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-4 text-sm text-slate-100">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-400">Senior · Growth</p>
          <h1 className="mt-1 text-2xl font-bold">City expansion</h1>
          <p className="mt-2 max-w-2xl text-slate-400">
            Readiness scoring, playbook tasks, and cloning the winning pricing + weight snapshot onto new cities.
            Refresh metrics to pull the latest operators, leads, and conversion from production data.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={loading || refreshing}
            onClick={() => load(true)}
            className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-500 disabled:opacity-50"
          >
            {refreshing ? "Refreshing…" : "Refresh metrics"}
          </button>
          <a
            href={`${dashBase}/senior/command-center`}
            className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800"
          >
            Command center
          </a>
        </div>
      </header>

      {error ?
        <div className="rounded-lg border border-red-500/40 bg-red-950/40 px-4 py-3 text-red-200">{error}</div>
      : null}

      <section className="rounded-xl border border-slate-700 bg-slate-950/80 p-4">
        <h2 className="text-base font-semibold text-slate-100">Suggestions</h2>
        <p className="mt-1 text-xs text-slate-500">Rule-based signals from demand, supply, and readiness (not an LLM).</p>
        {loading && !data ?
          <p className="mt-4 text-slate-500">Loading…</p>
        : null}
        {!loading && data && data.suggestions.length === 0 ?
          <p className="mt-4 text-slate-500">No alerts right now — metrics look balanced.</p>
        : null}
        <ul className="mt-4 space-y-2">
          {(data?.suggestions ?? []).map((s) => (
            <li
              key={`${s.cityId}-${s.message.slice(0, 24)}`}
              className={`rounded-lg px-3 py-2 text-sm ${
                s.severity === "warn" ? "bg-amber-950/40 text-amber-100 ring-1 ring-amber-500/25" : (
                  "bg-slate-900/80 text-slate-200 ring-1 ring-slate-700/60"
                )
              }`}
            >
              {s.message}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-slate-700 bg-slate-950/80 p-4">
        <h2 className="text-base font-semibold text-slate-100">Clone winning configuration</h2>
        <p className="mt-1 max-w-3xl text-xs text-slate-500">
          Copies city-scoped pricing rules and stores a snapshot (matching + lead scoring weights + playbook keys) on the
          target city. Optionally sync global weight tables — admin only, affects all markets.
        </p>
        <div className="mt-4 flex flex-wrap items-end gap-4">
          <label className="flex flex-col gap-1 text-xs text-slate-400">
            Source (template)
            <select
              className="min-w-[200px] rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100"
              value={sourceId}
              onChange={(e) => setSourceId(e.target.value)}
            >
              {(data?.cities ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} · {(c.readinessScore ?? 0).toFixed(1)}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-slate-400">
            Target (new / scaling city)
            <select
              className="min-w-[200px] rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100"
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
            >
              {(data?.cities ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          {props.tier === "admin" ?
            <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-400">
              <input type="checkbox" checked={applyGlobals} onChange={(e) => setApplyGlobals(e.target.checked)} />
              Apply weights globally
            </label>
          : null}
          <button
            type="button"
            disabled={cloneBusy || !sourceId || !targetId || sourceId === targetId}
            onClick={() => runClone()}
            className="rounded-lg bg-amber-600/90 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-500 disabled:opacity-40"
          >
            {cloneBusy ? "Cloning…" : "Clone"}
          </button>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Cities</h2>
        {loading && !data ?
          <p className="text-slate-500">Loading…</p>
        : null}
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full min-w-[920px] text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-900/80 text-slate-500">
              <tr>
                <th className="px-3 py-2 font-medium">City</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Readiness</th>
                <th className="px-3 py-2 font-medium">Progress</th>
                <th className="px-3 py-2 font-medium">Ops / leads</th>
                <th className="px-3 py-2 font-medium">Next tasks</th>
                <th className="px-3 py-2 font-medium">Tasks</th>
              </tr>
            </thead>
            <tbody>
              {(data?.cities ?? []).map((c) => (
                <tr key={c.id} className="border-b border-slate-800/80 align-top">
                  <td className="px-3 py-3">
                    <div className="font-medium text-slate-100">{c.name}</div>
                    <div className="text-[11px] text-slate-500">{c.country}</div>
                    {c.expansionClonedFromCity ?
                      <div className="mt-1 text-[11px] text-teal-500/90">Cloned from {c.expansionClonedFromCity}</div>
                    : null}
                  </td>
                  <td className="px-3 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] ring-1 ${statusPillClass(c.status)}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-teal-300">{c.readinessScore != null ? c.readinessScore.toFixed(1) : "—"}</td>
                  <td className="px-3 py-3">
                    <div className="h-2 w-full max-w-[120px] overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full rounded-full bg-teal-500/80 transition-all"
                        style={{ width: `${c.progressPct}%` }}
                      />
                    </div>
                    <span className="mt-1 block text-[11px] text-slate-500">{c.progressPct}%</span>
                  </td>
                  <td className="px-3 py-3 text-slate-400">
                    {c.operatorCount} ops · {c.leadCount} leads (90d)
                  </td>
                  <td className="px-3 py-3 text-slate-400">
                    <ul className="space-y-1">
                      {c.nextTasks.map((t) => (
                        <li key={t.id}>{TASK_LABEL[t.taskType] ?? t.taskType}</li>
                      ))}
                      {c.nextTasks.length === 0 ?
                        <li className="text-emerald-400/90">Playbook complete</li>
                      : null}
                    </ul>
                  </td>
                  <td className="px-3 py-3">
                    <ul className="space-y-1">
                      {c.tasks.map((t) => (
                        <li key={t.id} className="flex flex-wrap items-center gap-2">
                          <span className={t.status === "DONE" ? "text-emerald-400" : "text-slate-500"}>
                            {TASK_LABEL[t.taskType] ?? t.taskType}
                          </span>
                          {t.status === "PENDING" ?
                            <button
                              type="button"
                              className="text-[11px] text-teal-400 underline hover:text-teal-300"
                              onClick={() => markTask(t.id, "DONE")}
                            >
                              Mark done
                            </button>
                          : (
                            <button
                              type="button"
                              className="text-[11px] text-slate-500 underline hover:text-slate-400"
                              onClick={() => markTask(t.id, "PENDING")}
                            >
                              Reopen
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && data && data.cities.length === 0 ?
            <p className="px-4 py-8 text-center text-slate-500">
              No `SeniorCity` rows for this country yet. Add cities in Prisma Admin or seed, then refresh metrics.
            </p>
          : null}
        </div>
      </section>
    </div>
  );
}
