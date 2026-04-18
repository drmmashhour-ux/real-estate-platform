"use client";

import * as React from "react";

import { buildCompoundingPlan } from "@/modules/growth/compounding.service";

const STORAGE = "lec-compounding-v1-checklist";

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

export function CompoundingPanel() {
  const plan = React.useMemo(() => buildCompoundingPlan(), []);
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

  let total = 0;
  let completed = 0;
  plan.actions.forEach((block, bi) => {
    block.actions.forEach((_, si) => {
      total += 1;
      if (done[`b${bi}-s${si}`]) completed += 1;
    });
  });

  return (
    <section className="rounded-xl border border-lime-900/40 bg-lime-950/10 p-4" data-growth-compounding-v1>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-lime-300/90">Compounding engine</p>
          <h3 className="mt-1 text-lg font-semibold text-zinc-100">1 deal → more deals</h3>
          <p className="mt-1 max-w-xl text-[11px] text-zinc-500">
            Habits after a win — all manual. Ads budget changes stay human-approved; no auto-spend.
          </p>
        </div>
        <div className="text-right text-xs text-zinc-500">
          Steps done
          <p className="text-sm font-semibold text-lime-200">
            {completed}/{total}
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-4">
        {plan.actions.map((block, bi) => (
          <div key={block.title} className="rounded-lg border border-zinc-800/80 bg-black/25 p-3">
            <p className="text-sm font-semibold text-lime-100/90">{block.title}</p>
            <ul className="mt-2 space-y-2">
              {block.actions.map((line, si) => {
                const id = `b${bi}-s${si}`;
                const checked = !!done[id];
                return (
                  <li key={id} className="flex items-start gap-2 text-sm text-zinc-300">
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 shrink-0 rounded border-zinc-600"
                      checked={checked}
                      onChange={() => toggle(id)}
                    />
                    <span className={checked ? "text-zinc-500 line-through" : ""}>{line}</span>
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
