"use client";

import * as React from "react";

import { build30DayDominationPlan } from "@/modules/growth/city-domination.service";

function storageKey(city: string): string {
  return `lec-city-domination-v1:${city.trim().toLowerCase() || "default"}`;
}

function loadDone(key: string): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(key);
    const j = raw ? (JSON.parse(raw) as unknown) : {};
    return j && typeof j === "object" && !Array.isArray(j) ? (j as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

function saveDone(key: string, done: Record<string, boolean>): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(done));
  } catch {
    /* ignore */
  }
}

export function CityDominationPanel({ defaultCity = "Montréal" }: { defaultCity?: string }) {
  const [city, setCity] = React.useState(defaultCity);
  const plan = React.useMemo(() => build30DayDominationPlan(city), [city]);
  const key = React.useMemo(() => storageKey(city), [city]);
  const [done, setDone] = React.useState<Record<string, boolean>>({});

  React.useEffect(() => {
    setDone(loadDone(key));
  }, [key]);

  const toggle = (id: string) => {
    setDone((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      saveDone(key, next);
      return next;
    });
  };

  const total = plan.days.reduce((n, w) => n + w.actions.length, 0);
  const completed = plan.days.reduce(
    (n, w) => n + w.actions.filter((_, i) => done[`w${w.day}-a${i}`]).length,
    0,
  );

  return (
    <section
      className="rounded-xl border border-orange-900/50 bg-orange-950/15 p-4"
      data-growth-city-domination-v1
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-orange-300/90">
            City domination (30 days)
          </p>
          <h3 className="mt-1 text-lg font-semibold text-zinc-100">Weekly milestones</h3>
          <p className="mt-1 max-w-xl text-[11px] text-zinc-500">
            Human execution — check off actions locally. No auto-spend; pricing changes require separate approval flows.
          </p>
        </div>
        <label className="flex flex-col gap-1 text-xs text-zinc-400">
          City
          <input
            className="w-44 rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm text-zinc-100"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
        </label>
      </div>

      <p className="mt-3 text-sm text-zinc-400">
        Market: <strong className="text-orange-200">{plan.city}</strong> · Progress{" "}
        <strong className="text-orange-200">
          {completed}/{total}
        </strong>
      </p>

      <ol className="mt-4 space-y-4">
        {plan.days.map((w) => (
          <li key={w.day} className="rounded-lg border border-zinc-800/90 bg-black/25 p-3">
            <p className="text-sm font-semibold text-orange-200/90">
              Days {w.day}–{w.day + 6} · {w.focus}
            </p>
            <ul className="mt-2 space-y-2">
              {w.actions.map((a, i) => {
                const id = `w${w.day}-a${i}`;
                const checked = !!done[id];
                return (
                  <li key={id} className="flex gap-2 text-sm text-zinc-300">
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 shrink-0 rounded border-zinc-600"
                      checked={checked}
                      onChange={() => toggle(id)}
                      aria-label={a}
                    />
                    <span className={checked ? "text-zinc-500 line-through" : undefined}>{a}</span>
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
