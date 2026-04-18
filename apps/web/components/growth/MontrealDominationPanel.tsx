"use client";

import * as React from "react";

import { buildMontrealDominationPlan } from "@/modules/growth/montreal-domination.service";

const STORAGE = "lec-montreal-domination-v1";

function loadDone(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE);
    const j = raw ? (JSON.parse(raw) as unknown) : {};
    return j && typeof j === "object" && !Array.isArray(j) ? (j as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

function saveDone(done: Record<string, boolean>): void {
  try {
    window.localStorage.setItem(STORAGE, JSON.stringify(done));
  } catch {
    /* ignore */
  }
}

export function MontrealDominationPanel() {
  const plan = React.useMemo(() => buildMontrealDominationPlan(), []);
  const [done, setDone] = React.useState<Record<string, boolean>>({});

  React.useEffect(() => {
    setDone(loadDone());
  }, []);

  const toggle = (id: string) => {
    setDone((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      saveDone(next);
      return next;
    });
  };

  const total = plan.weeks.reduce((n, w) => n + w.actions.length, 0);
  const completed = plan.weeks.reduce(
    (n, w) => n + w.actions.filter((_, i) => done[`w${w.week}-a${i}`]).length,
    0,
  );

  return (
    <section
      className="rounded-xl border border-rose-900/40 bg-rose-950/15 p-4"
      data-growth-city-domination-mtl-v1
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-rose-300/90">City domination — Montréal</p>
          <h3 className="mt-1 text-lg font-semibold text-zinc-100">30-day step-by-step</h3>
          <p className="mt-1 max-w-xl text-[11px] text-zinc-500">
            Human execution only. Ads and pricing changes follow your governance rules — never auto-applied from the
            platform.
          </p>
        </div>
        <div className="text-right text-xs text-zinc-500">
          Progress
          <p className="text-sm font-semibold text-rose-200">
            {completed}/{total}
          </p>
        </div>
      </div>

      <p className="mt-3 text-sm text-zinc-400">
        Market: <strong className="text-rose-100/90">{plan.city}</strong>
      </p>

      <div className="mt-4 space-y-4">
        {plan.weeks.map((w) => (
          <div key={w.week} className="rounded-lg border border-zinc-800/90 bg-black/30 p-3">
            <p className="text-sm font-semibold text-zinc-200">Week {w.week}</p>
            <ul className="mt-2 space-y-2">
              {w.actions.map((action, i) => {
                const id = `w${w.week}-a${i}`;
                const checked = !!done[id];
                return (
                  <li key={id} className="flex items-start gap-2 text-sm text-zinc-300">
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 shrink-0 rounded border-zinc-600"
                      checked={checked}
                      onChange={() => toggle(id)}
                    />
                    <span className={checked ? "text-zinc-500 line-through" : ""}>{action}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
