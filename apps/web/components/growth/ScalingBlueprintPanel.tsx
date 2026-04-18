"use client";

import * as React from "react";

import { build14DayScalingBlueprint } from "@/modules/growth/scaling-blueprint.service";

function storageKey(city: string): string {
  return `lecipm-scaling-blueprint-v1:${city.trim().toLowerCase() || "default"}`;
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
    /* ignore */
  }
}

export function ScalingBlueprintPanel({ defaultCity = "Montréal" }: { defaultCity?: string }) {
  const [city, setCity] = React.useState(defaultCity);
  const blueprint = React.useMemo(() => build14DayScalingBlueprint(city), [city]);
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

  const total = blueprint.days.reduce((n, d) => n + d.actions.length, 0);
  const completed = blueprint.days.reduce(
    (n, d) => n + d.actions.filter((_, i) => done[`b${d.day}-a${i}`]).length,
    0,
  );

  return (
    <section
      className="rounded-xl border border-emerald-900/50 bg-emerald-950/15 p-4"
      data-growth-scaling-blueprint-v1
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-emerald-300/90">14-day scaling (V1)</p>
          <h3 className="mt-1 text-lg font-semibold text-zinc-100">Blueprint</h3>
          <p className="mt-1 max-w-xl text-[11px] text-zinc-500">
            Check off actions as you go (saved in this browser). Toward ~$10K scale — execution is manual.
          </p>
        </div>
        <label className="flex flex-col gap-1 text-xs text-zinc-400">
          City label
          <input
            className="w-44 rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm text-zinc-100"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
        </label>
      </div>

      <p className="mt-3 text-sm text-zinc-400">
        Progress:{" "}
        <strong className="text-emerald-300">
          {completed}/{total}
        </strong>{" "}
        actions
      </p>

      <ol className="mt-4 space-y-4">
        {blueprint.days.map((d) => (
          <li key={d.day} className="rounded-lg border border-zinc-800/90 bg-black/25 p-3">
            <p className="text-sm font-semibold text-emerald-200/90">{d.focus}</p>
            <ul className="mt-2 space-y-2">
              {d.actions.map((a, i) => {
                const id = `b${d.day}-a${i}`;
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
