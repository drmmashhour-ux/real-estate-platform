"use client";

import * as React from "react";

import { build7DayDealPlan } from "@/modules/growth/deal-execution-plan.service";

function storageKey(city: string): string {
  return `lecipm-deal-exec-v1:${city.trim().toLowerCase() || "default"}`;
}

function loadDone(key: string): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return {};
    const j = JSON.parse(raw) as unknown;
    return j && typeof j === "object" && !Array.isArray(j) ? (j as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

function saveDone(key: string, done: Record<string, boolean>): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(done));
  } catch {
    /* ignore quota */
  }
}

export function DealExecutionPlanPanel({ defaultCity = "Montréal" }: { defaultCity?: string }) {
  const [city, setCity] = React.useState(defaultCity);
  const plan = React.useMemo(() => build7DayDealPlan(city), [city]);
  const key = React.useMemo(() => storageKey(city), [city]);
  const [done, setDone] = React.useState<Record<string, boolean>>({});

  React.useEffect(() => {
    setDone(loadDone(key));
  }, [key]);

  const toggle = (taskId: string) => {
    setDone((prev) => {
      const next = { ...prev, [taskId]: !prev[taskId] };
      saveDone(key, next);
      return next;
    });
  };

  const totalTasks = plan.days.reduce((n, d) => n + d.tasks.length, 0);
  const completed = plan.days.reduce(
    (n, d) => n + d.tasks.filter((_, i) => done[`d${d.day}-t${i}`]).length,
    0,
  );

  return (
    <section
      className="rounded-xl border border-teal-900/40 bg-teal-950/15 p-4"
      data-growth-deal-execution-plan-v1
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-teal-300/90">
            7-day deal execution (V1)
          </p>
          <h3 className="mt-1 text-lg font-semibold text-zinc-100">Sprint checklist</h3>
          <p className="mt-1 max-w-xl text-[11px] text-zinc-500">
            Human-executed tasks only — check items as you complete them (saved in this browser). No messages are sent from
            this panel.
          </p>
        </div>
        <label className="flex flex-col gap-1 text-xs text-zinc-400">
          City focus
          <input
            className="w-40 rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm text-zinc-100"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
        </label>
      </div>

      <p className="mt-3 text-sm text-zinc-400">
        Progress:{" "}
        <strong className="text-teal-300">
          {completed}/{totalTasks}
        </strong>{" "}
        tasks
      </p>

      <ol className="mt-4 space-y-4">
        {plan.days.map((d) => (
          <li key={d.day} className="rounded-lg border border-zinc-800/90 bg-black/25 p-3">
            <p className="text-sm font-semibold text-zinc-100">
              DAY {d.day} — {d.title}
            </p>
            <ul className="mt-2 space-y-2">
              {d.tasks.map((t, i) => {
                const id = `d${d.day}-t${i}`;
                const checked = !!done[id];
                return (
                  <li key={id} className="flex gap-2 text-sm text-zinc-300">
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 shrink-0 rounded border-zinc-600"
                      checked={checked}
                      onChange={() => toggle(id)}
                      aria-label={t}
                    />
                    <span className={checked ? "text-zinc-500 line-through" : undefined}>{t}</span>
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ol>
    </section>
  );
}
