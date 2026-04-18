"use client";

import * as React from "react";
import type { MoneyOperatingSystemSnapshot } from "@/modules/revenue/money-os.types";

function cad(n: number): string {
  return n.toLocaleString("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 });
}

function pct(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return `${n.toFixed(1)}%`;
}

const LS_KEY = "lecipm-money-os-v1";

type Persisted = {
  dayKey: string;
  doneIds: string[];
  brokersContacted: number;
  listingsAdded: number;
  snapshots: { actionId: string; weekRev: number; at: string }[];
};

function utcDayKey(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

function loadPersisted(): Persisted {
  if (typeof window === "undefined") {
    return { dayKey: utcDayKey(), doneIds: [], brokersContacted: 0, listingsAdded: 0, snapshots: [] };
  }
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) throw new Error("empty");
    const j = JSON.parse(raw) as Persisted;
    if (j.dayKey !== utcDayKey()) {
      return {
        dayKey: utcDayKey(),
        doneIds: [],
        brokersContacted: 0,
        listingsAdded: 0,
        snapshots: j.snapshots?.slice(-20) ?? [],
      };
    }
    return {
      dayKey: j.dayKey,
      doneIds: Array.isArray(j.doneIds) ? j.doneIds : [],
      brokersContacted: typeof j.brokersContacted === "number" ? j.brokersContacted : 0,
      listingsAdded: typeof j.listingsAdded === "number" ? j.listingsAdded : 0,
      snapshots: Array.isArray(j.snapshots) ? j.snapshots.slice(-30) : [],
    };
  } catch {
    return { dayKey: utcDayKey(), doneIds: [], brokersContacted: 0, listingsAdded: 0, snapshots: [] };
  }
}

function savePersisted(p: Persisted): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(p));
  } catch {
    /* ignore quota */
  }
}

async function copyText(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    /* ignore */
  }
}

export function MoneyOperatingSystemDashboard() {
  const [data, setData] = React.useState<MoneyOperatingSystemSnapshot | null>(null);
  const [err, setErr] = React.useState<string | null>(null);
  const [persisted, setPersisted] = React.useState<Persisted>(() =>
    typeof window === "undefined"
      ? { dayKey: "", doneIds: [], brokersContacted: 0, listingsAdded: 0, snapshots: [] }
      : loadPersisted(),
  );

  React.useEffect(() => {
    setPersisted(loadPersisted());
  }, []);

  const refresh = React.useCallback(() => {
    void fetch("/api/admin/money-os", { credentials: "same-origin" })
      .then(async (r) => {
        const j = (await r.json()) as { snapshot?: MoneyOperatingSystemSnapshot; error?: string };
        if (!r.ok) throw new Error(j.error ?? "Failed");
        if (j.snapshot) setData(j.snapshot);
      })
      .catch((e: Error) => setErr(e.message));
  }, []);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  const toggleDone = (actionId: string, weekRev: number) => {
    const now = loadPersisted();
    const done = new Set(now.doneIds);
    if (done.has(actionId)) {
      done.delete(actionId);
    } else {
      done.add(actionId);
      now.snapshots.push({ actionId, weekRev, at: new Date().toISOString() });
    }
    const next = { ...now, doneIds: [...done] };
    savePersisted(next);
    setPersisted(next);
  };

  const bumpBrokers = () => {
    const now = loadPersisted();
    const next = { ...now, brokersContacted: now.brokersContacted + 1 };
    savePersisted(next);
    setPersisted(next);
  };

  const bumpListings = () => {
    const now = loadPersisted();
    const next = { ...now, listingsAdded: now.listingsAdded + 1 };
    savePersisted(next);
    setPersisted(next);
  };

  if (err) {
    return (
      <div className="rounded-xl border border-red-900/50 bg-red-950/40 p-4 text-sm text-red-200">{err}</div>
    );
  }
  if (!data) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-6 text-sm text-slate-500">Loading…</div>
    );
  }

  const dailyVs =
    data.progress.dailyPct != null ? Math.min(100, data.progress.dailyPct) : null;
  const effectiveLocal = persisted.snapshots.filter((s) => {
    const t = new Date(s.at).getTime();
    return Date.now() - t < 7 * 86400000 && data.revenueWeek >= s.weekRev * 1.03;
  });

  return (
    <div className="space-y-10">
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Metric label="Revenue today" value={cad(data.revenueToday)} accent />
        <Metric label="Revenue this week" value={cad(data.revenueWeek)} />
        <Metric
          label="MRR (subscriptions)"
          value={data.mrrCad != null ? cad(data.mrrCad) : "—"}
          sub={
            data.mrrMissingData
              ? `${data.mrrSubscriptionCount} subs · some rows missing mrrCents`
              : data.mrrCad != null
                ? `${data.mrrSubscriptionCount} active subs`
                : "No subscription MRR in DB"
          }
        />
        <Metric
          label="% vs daily target"
          value={pct(dailyVs)}
          sub={`Goal ${cad(data.targets.dailyTargetCad)} / day`}
        />
      </section>

      <section className="rounded-xl border border-emerald-900/40 bg-emerald-950/20 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-medium text-emerald-100">{data.progress.gapMessageToday}</p>
          <p className="text-[11px] text-emerald-200/70">
            Week {pct(data.progress.weeklyPct)} · Month {pct(data.progress.monthlyPct)}
          </p>
        </div>
        {dailyVs != null ? (
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-900">
            <div
              className="h-full rounded-full bg-emerald-500/90 transition-all"
              style={{ width: `${Math.min(100, dailyVs)}%` }}
            />
          </div>
        ) : null}
      </section>

      {data.criticalAlerts.length > 0 ? (
        <section className="rounded-xl border border-amber-700/50 bg-amber-950/30 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-300">Critical / urgent</p>
          <ul className="mt-2 space-y-2">
            {data.criticalAlerts.map((a) => (
              <li key={a.id} className="text-sm text-amber-50">
                <span className="font-semibold">{a.title}</span>
                <span className="block text-[12px] text-amber-200/80">{a.description}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="rounded-xl border border-violet-800/45 bg-violet-950/25 px-4 py-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-300">
              Automation engine
            </p>
            <p className="mt-1 text-[11px] text-slate-500">
              Suggest → assisted copy → safe triggers only. Kill switch: FEATURE_AUTOMATION_KILL_SWITCH — no payments /
              price writes.
            </p>
          </div>
          <p className="text-[11px] text-slate-500">
            Market {data.automationCycle?.countryCode ?? "—"} · Last run{" "}
            {(data.automationCycle?.ranAt ?? data.generatedAt).slice(0, 19)}
          </p>
        </div>

        {!data.automationCycle ? (
          <p className="mt-4 text-sm text-slate-400">
            Enable <code className="text-violet-300">FEATURE_REVENUE_AUTOMATION_V1</code> and disable the kill switch
            to populate automation cycles.
          </p>
        ) : data.automationCycle.skipped ? (
          <p className="mt-4 text-sm text-slate-400">{data.automationCycle.skipReason}</p>
        ) : (
          <>
            <p className="mt-3 text-[11px] text-slate-500">
              Triggers:{" "}
              {data.automationCycle.triggersFired.length
                ? data.automationCycle.triggersFired.join(", ")
                : "none fired"}
              {" · "}
              Actions generated: {data.automationCycle.actions.length} (cap{" "}
              {data.automationCycle.maxActionsCap}/run)
            </p>
            <ul className="mt-4 space-y-4">
              {data.automationCycle.actions.map((act) => (
                <li
                  key={act.id}
                  className="rounded-lg border border-slate-800/90 bg-black/35 px-3 py-3 text-sm text-slate-200"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] uppercase text-violet-200">
                        {act.kind === "assisted"
                          ? "assisted"
                          : act.kind === "auto_trigger_safe"
                            ? "auto (safe)"
                            : "suggestion"}
                      </span>
                      <p className="mt-2 font-semibold text-white">{act.title}</p>
                      <p className="mt-1 text-[12px] text-slate-400">{act.explanation}</p>
                      <p className="mt-1 text-[11px] text-slate-600">
                        Impact {act.impactScore} · Urgency {act.urgencyScore} · Score {act.combinedScore}
                      </p>
                    </div>
                    <label className="flex cursor-pointer items-center gap-2 text-[11px] text-slate-400">
                      <input
                        type="checkbox"
                        checked={persisted.doneIds.includes(act.id)}
                        onChange={() => toggleDone(act.id, data.revenueWeek)}
                        className="accent-violet-500"
                      />
                      Done
                    </label>
                  </div>
                  {act.assisted?.copyBlock || act.assisted?.brokerOutreachDraft ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          void copyText(act.assisted?.copyBlock ?? act.assisted?.brokerOutreachDraft ?? "")
                        }
                        className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] text-slate-200 hover:bg-slate-800"
                      >
                        Copy draft
                      </button>
                      {act.assisted?.navigatePath ? (
                        <a
                          href={act.assisted.navigatePath}
                          className="rounded border border-violet-800/60 px-2 py-1 text-[11px] text-violet-300 hover:bg-violet-950/40"
                        >
                          Open screen
                        </a>
                      ) : null}
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-[11px] text-slate-600">
              Completed today (tracked locally):{" "}
              {persisted.doneIds.filter((id) => data.automationCycle?.actions.some((a) => a.id === id)).length} /{" "}
              {data.automationCycle.actions.length}
            </p>
          </>
        )}
      </section>

      <section>
        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Signals (top 5)</h2>
        <ul className="mt-3 space-y-1.5 text-sm text-slate-300">
          {data.keyInsights.map((k, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-emerald-500">●</span>
              {k.text}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Source breakdown</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {data.sources.map((s) => (
            <div key={s.key} className="rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-white">{s.label}</p>
                <span
                  className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                    s.health === "GOOD"
                      ? "bg-emerald-950 text-emerald-300"
                      : s.health === "WEAK"
                        ? "bg-amber-950 text-amber-200"
                        : "bg-red-950 text-red-200"
                  }`}
                >
                  {s.health}
                </span>
              </div>
              <p className="mt-2 text-2xl font-semibold text-emerald-300">{cad(s.amountCad)}</p>
              <p className="mt-1 text-[11px] text-slate-500">
                {s.pctOfWeekTotal.toFixed(1)}% of week · trend {s.trend.toUpperCase()}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Top revenue leaks</h2>
        <ul className="mt-3 space-y-3">
          {data.topLeaks.map((l) => (
            <li key={l.id} className="rounded-lg border border-slate-800 bg-black/30 px-3 py-2 text-sm">
              <span className="font-semibold text-slate-100">{l.title}</span>
              <p className="mt-1 text-[12px] text-slate-400">{l.detail}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-emerald-800/40 bg-slate-900/40 px-4 py-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-emerald-300">
            Today&apos;s money actions
          </h2>
          <button
            type="button"
            onClick={() => refresh()}
            className="text-[11px] font-medium text-emerald-400 hover:text-emerald-300"
          >
            Refresh data
          </button>
        </div>
        <ul className="mt-4 space-y-3">
          {data.actions.map((a) => (
            <li
              key={a.id}
              className="flex flex-wrap items-start gap-3 rounded-lg border border-slate-800/80 bg-black/40 px-3 py-3"
            >
              <input
                type="checkbox"
                checked={persisted.doneIds.includes(a.id)}
                onChange={() => toggleDone(a.id, data.revenueWeek)}
                className="mt-1 h-4 w-4 accent-emerald-500"
              />
              <div>
                <p className="text-sm font-medium text-white">{a.text}</p>
                <p className="mt-0.5 text-[11px] text-slate-500">{a.rationale}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-4">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Daily checklist</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-2">
              <dt className="text-slate-400">Brokers contacted</dt>
              <dd className="font-mono text-white">{persisted.brokersContacted}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-400">Listings added (logged)</dt>
              <dd className="font-mono text-white">{persisted.listingsAdded}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-400">Revenue today (UTC)</dt>
              <dd className="font-mono text-emerald-300">{cad(data.revenueToday)}</dd>
            </div>
          </dl>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={bumpBrokers}
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-[11px] text-slate-200 hover:bg-slate-800"
            >
              +1 broker touch
            </button>
            <button
              type="button"
              onClick={bumpListings}
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-[11px] text-slate-200 hover:bg-slate-800"
            >
              +1 listing logged
            </button>
          </div>
          <p className="mt-3 text-[11px] text-slate-600">{data.checklistHints.brokersToContactHint}</p>
          <p className="mt-1 text-[11px] text-slate-600">{data.checklistHints.listingsSupplyHint}</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-4">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Performance loop (local)
          </h2>
          <p className="mt-2 text-[11px] text-slate-500">
            When you complete an action, we store week revenue at that moment (browser only). Refresh later — if week
            revenue rose ≥3%, we surface a weak “effective” signal.
          </p>
          <ul className="mt-3 space-y-2 text-[12px] text-slate-400">
            {persisted.snapshots.slice(-6).map((s, i) => (
              <li key={i}>
                {s.actionId}: week was {cad(s.weekRev)} @ {s.at.slice(0, 16)}
              </li>
            ))}
          </ul>
          {effectiveLocal.length > 0 ? (
            <p className="mt-3 text-sm font-medium text-emerald-400">
              Most effective (local uptick): {effectiveLocal.map((s) => s.actionId).join(", ")}
            </p>
          ) : (
            <p className="mt-3 text-[11px] text-slate-600">Complete actions + refresh after pipeline moves revenue.</p>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Auto-suggestions (advisory)</h2>
        <ul className="mt-3 space-y-2">
          {data.autoSuggestions.map((s) => (
            <li key={s.id} className="rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2 text-sm text-slate-300">
              {s.text}
            </li>
          ))}
        </ul>
      </section>

      <footer className="border-t border-slate-800 pt-6 text-[11px] text-slate-600">
        Generated {data.generatedAt.slice(0, 19)} · Dashboard {data.summaryCreatedAt.slice(0, 19)} · Prior week $
        {data.meta.priorWeekTotalCad.toFixed(0)} · Reads only — no auto pricing changes.
      </footer>
    </div>
  );
}

function Metric({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border px-4 py-4 ${
        accent ? "border-emerald-700/40 bg-emerald-950/25" : "border-slate-800 bg-slate-900/50"
      }`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${accent ? "text-emerald-300" : "text-white"}`}>{value}</p>
      {sub ? <p className="mt-1 text-[11px] text-slate-500">{sub}</p> : null}
    </div>
  );
}
