"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { addDays, format, parseISO } from "date-fns";

import type { MarketingAutonomyLevel } from "@/modules/marketing-ai/marketing-ai.types";
import {
  approveQueueItem,
  enqueueSlot,
  evaluateMarketingAiAlerts,
  generateWeeklyPlan,
  getAutonomyLevel,
  ingestPostedPerformance,
  loadMarketingAiStore,
  materializeApprovedToCalendar,
  rejectQueueItem,
  saveWeeklyPlan,
  setAutonomyLevel,
} from "@/modules/marketing-ai";
import { listContentItems } from "@/modules/marketing-content/content-calendar.service";
import {
  buildMarketingContentDashboardSummaryFromItems,
  rankByPerformance,
} from "@/modules/marketing-content/content-performance.service";

type Props = {
  adminBase: string;
  marketingHubHref: string;
};

export function AutonomousMarketingEngineClient({ adminBase, marketingHubHref }: Props) {
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((x) => x + 1), []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    evaluateMarketingAiAlerts(listContentItems());
    refresh();
  }, []);

  useEffect(() => {
    const store = loadMarketingAiStore();
    const timer = window.setTimeout(() => {
      fetch("/api/dashboard/marketing/marketing-ai/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(store),
      }).catch(() => {});
    }, 600);
    return () => window.clearTimeout(timer);
  }, [tick]);

  const store = useMemo(() => loadMarketingAiStore(), [tick]);
  const items = useMemo(() => listContentItems(), [tick]);
  const summary = useMemo(
    () => buildMarketingContentDashboardSummaryFromItems(items),
    [items]
  );
  const ranked = useMemo(() => rankByPerformance(items.filter((i) => i.status === "POSTED")), [items]);

  const autonomy = getAutonomyLevel();

  function generatePlan() {
    const level = getAutonomyLevel();
    const plan = generateWeeklyPlan(new Date(), { slotsTotal: 10 });
    saveWeeklyPlan(plan);
    if (level === "SAFE_AUTOPILOT") {
      for (const slot of plan.slots) {
        const pack = slot.generated;
        if (pack) enqueueSlot(slot, pack, plan.weekStartIso, level);
      }
    }
    refresh();
  }

  function enqueuePlanToQueue() {
    const p = loadMarketingAiStore().weeklyPlan;
    if (!p) return;
    const level = getAutonomyLevel();
    for (const slot of p.slots) {
      const pack = slot.generated;
      if (pack) enqueueSlot(slot, pack, p.weekStartIso, level);
    }
    refresh();
  }

  function syncLearningNow() {
    ingestPostedPerformance(listContentItems());
    evaluateMarketingAiAlerts(listContentItems());
    refresh();
  }

  function onAutonomyChange(level: MarketingAutonomyLevel) {
    setAutonomyLevel(level);
    refresh();
  }

  const weekLabel = store.weeklyPlan
    ? format(parseISO(`${store.weeklyPlan.weekStartIso}T12:00:00`), "MMM d, yyyy")
    : "—";

  return (
    <div className="space-y-10 text-white">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-zinc-500">
            <Link href={marketingHubHref} className="hover:text-zinc-300">
              ← Marketing Hub
            </Link>
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">Autonomous Marketing Engine</h1>
          <p className="mt-1 max-w-2xl text-sm text-zinc-500">
            Semi-autonomous by default: the engine proposes a weekly mix, generates copy, and queues
            items for approval before anything hits the Content Calendar or goes live.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <Link
            href={`${marketingHubHref}/calendar`}
            className="rounded-lg border border-violet-500/40 bg-violet-950/30 px-3 py-2 text-violet-100 hover:bg-violet-950/50"
          >
            Content Calendar
          </Link>
          <Link
            href={`${adminBase}/revenue-predictor`}
            className="rounded-lg border border-emerald-500/40 bg-emerald-950/30 px-3 py-2 text-emerald-100 hover:bg-emerald-950/50"
          >
            Revenue Predictor
          </Link>
          <Link
            href={`${adminBase}/ai-sales-manager`}
            className="rounded-lg border border-sky-500/40 bg-sky-950/30 px-3 py-2 text-sky-100 hover:bg-sky-950/50"
          >
            AI Sales Manager
          </Link>
        </div>
      </div>

      <section className="grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 sm:grid-cols-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-zinc-500">Attributed leads</p>
          <p className="text-2xl font-semibold text-emerald-300">{summary.leadsFromContent}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-zinc-500">Attributed revenue</p>
          <p className="text-2xl font-semibold text-amber-200">
            ${(summary.revenueFromContentCents / 100).toFixed(0)}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-zinc-500">Posts this week</p>
          <p className="text-2xl font-semibold text-white">{summary.postsThisWeek}</p>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-zinc-950/50 p-5">
        <h2 className="text-lg font-semibold">Autonomy control</h2>
        <p className="mt-1 text-xs text-zinc-500">
          OFF = manual only · ASSIST = suggestions · SAFE_AUTOPILOT = generate + queue (approve before
          calendar) · FULL_AUTOPILOT reserved for future auto-post adapters.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {(
            [
              ["OFF", "OFF"],
              ["ASSIST", "ASSIST"],
              ["SAFE_AUTOPILOT", "SAFE autopilot"],
              ["FULL_AUTOPILOT", "FULL (future)"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              disabled={value === "FULL_AUTOPILOT"}
              onClick={() => onAutonomyChange(value)}
              className={`rounded-xl border px-4 py-2 text-sm font-medium ${
                autonomy === value
                  ? "border-amber-400 bg-amber-500/20 text-amber-50"
                  : "border-white/15 text-zinc-300 hover:bg-white/10"
              } ${value === "FULL_AUTOPILOT" ? "cursor-not-allowed opacity-40" : ""}`}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-zinc-950/50 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Weekly plan</h2>
            <p className="text-xs text-zinc-500">Week starting {weekLabel}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={generatePlan}
              className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-black hover:bg-amber-500"
            >
              Generate / refresh plan
            </button>
            <button
              type="button"
              onClick={syncLearningNow}
              className="rounded-lg border border-white/15 px-4 py-2 text-sm text-white hover:bg-white/10"
            >
              Sync learning from calendar
            </button>
            <button
              type="button"
              onClick={enqueuePlanToQueue}
              className="rounded-lg border border-fuchsia-500/30 px-4 py-2 text-sm text-fuchsia-100 hover:bg-fuchsia-950/30"
            >
              Add plan to queue
            </button>
          </div>
        </div>

        {!store.weeklyPlan ? (
          <p className="mt-4 text-sm text-zinc-500">No plan yet — generate one.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase text-zinc-500">
                  <th className="py-2 pr-2">Day</th>
                  <th className="py-2 pr-2">Slot</th>
                  <th className="py-2 pr-2">Platform</th>
                  <th className="py-2 pr-2">Type</th>
                  <th className="py-2 pr-2">Audience</th>
                  <th className="py-2 pr-2">Goal</th>
                  <th className="py-2">Topic</th>
                </tr>
              </thead>
              <tbody>
                {store.weeklyPlan.slots.map((s) => {
                  const ws = parseISO(`${store.weeklyPlan!.weekStartIso}T12:00:00`);
                  const dayDate = addDays(ws, s.dayOffset);
                  return (
                    <tr key={s.id} className="border-b border-white/5">
                      <td className="py-2 pr-2 text-zinc-400">{format(dayDate, "EEE MMM d")}</td>
                      <td className="py-2 pr-2">{s.suggestedSlot}</td>
                      <td className="py-2 pr-2">{s.platform}</td>
                      <td className="py-2 pr-2">{s.contentType}</td>
                      <td className="py-2 pr-2">{s.audience}</td>
                      <td className="py-2 pr-2">{s.goal}</td>
                      <td className="py-2 text-zinc-300">{s.topic}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-white/10 bg-zinc-950/50 p-5">
        <h2 className="text-lg font-semibold">Content queue</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Pending approval rows must be approved before pushing into the calendar (SAFE_AUTOPILOT).
        </p>
        <ul className="mt-4 space-y-3">
          {store.queue.length === 0 ? (
            <li className="text-sm text-zinc-600">Queue empty.</li>
          ) : (
            store.queue.map((q) => (
              <li
                key={q.id}
                className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <span className="text-xs uppercase text-zinc-500">{q.status}</span>
                    <p className="font-medium text-white">{q.title}</p>
                    <p className="mt-1 text-zinc-400 line-clamp-2">{q.previewHook}</p>
                    <p className="mt-1 text-[11px] text-zinc-600">
                      {q.platform} · {q.scheduledDayIso ?? "—"} · {q.suggestedSlot}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {q.status === "PENDING_APPROVAL" ? (
                      <>
                        <button
                          type="button"
                          className="rounded-lg bg-emerald-700/80 px-3 py-1 text-xs text-white hover:bg-emerald-600"
                          onClick={() => {
                            approveQueueItem(q.id);
                            refresh();
                          }}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          className="rounded-lg border border-rose-500/40 px-3 py-1 text-xs text-rose-200 hover:bg-rose-950/40"
                          onClick={() => {
                            rejectQueueItem(q.id);
                            refresh();
                          }}
                        >
                          Reject
                        </button>
                      </>
                    ) : null}
                    {q.status === "APPROVED" ? (
                      <button
                        type="button"
                        className="rounded-lg border border-violet-500/40 px-3 py-1 text-xs text-violet-100 hover:bg-violet-950/40"
                        onClick={() => {
                          materializeApprovedToCalendar(q.id);
                          refresh();
                        }}
                      >
                        Push to calendar
                      </button>
                    ) : null}
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="rounded-2xl border border-white/10 bg-zinc-950/50 p-5">
        <h2 className="text-lg font-semibold">Performance insights</h2>
        <div className="mt-4 grid gap-6 lg:grid-cols-2">
          <div>
            <h3 className="text-xs uppercase tracking-wide text-zinc-500">Top posted</h3>
            <ul className="mt-2 space-y-2 text-sm">
              {ranked.slice(0, 5).length === 0 ? (
                <li className="text-zinc-600">No posted items with metrics yet.</li>
              ) : (
                ranked.slice(0, 5).map((it) => (
                  <li key={it.id} className="rounded-lg border border-white/10 px-3 py-2">
                    <span className="font-medium text-white">{it.title}</span>
                    <p className="text-[11px] text-zinc-500">
                      {it.platform} · leads {it.performance.leads} · $
                      {(it.performance.revenueCents / 100).toFixed(0)}
                    </p>
                  </li>
                ))
              )}
            </ul>
          </div>
          <div>
            <h3 className="text-xs uppercase tracking-wide text-zinc-500">Weak / watch list</h3>
            <ul className="mt-2 space-y-2 text-sm">
              {(() => {
                const posted = items.filter((i) => i.status === "POSTED");
                if (posted.length === 0) {
                  return <li className="text-zinc-600">Nothing posted yet.</li>;
                }
                return [...posted]
                  .sort((a, b) => {
                    const sa = a.performance.views + a.performance.clicks * 2;
                    const sb = b.performance.views + b.performance.clicks * 2;
                    return sa - sb;
                  })
                  .slice(0, 5)
                  .map((it) => (
                    <li key={it.id} className="rounded-lg border border-white/10 px-3 py-2">
                      <span className="font-medium text-white">{it.title}</span>
                      <p className="text-[11px] text-zinc-500">
                        views {it.performance.views} · clicks {it.performance.clicks}
                      </p>
                    </li>
                  ));
              })()}
            </ul>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-amber-500/20 bg-amber-950/15 p-5">
        <h2 className="text-lg font-semibold text-amber-100">Alerts</h2>
        <ul className="mt-3 space-y-2 text-sm text-zinc-300">
          {store.alerts.length === 0 ? (
            <li className="text-zinc-600">No active alerts.</li>
          ) : (
            store.alerts.map((a) => (
              <li key={a.id}>
                <span className="font-medium text-white">{a.title}</span> — {a.body}
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="rounded-2xl border border-white/10 bg-black/40 p-5 text-xs text-zinc-500">
        <p>
          Approval log entries: <strong className="text-zinc-300">{store.approvalLogs.length}</strong>{" "}
          decisions recorded locally (browser + optional server sync for mobile).
        </p>
      </section>
    </div>
  );
}
