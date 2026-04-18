"use client";

import * as React from "react";

import { buildScaleRoadmap } from "@/modules/growth/scale-roadmap.service";
import type { ScaleStage } from "@/modules/growth/scale-roadmap.types";

const STAGE_LABEL: Record<ScaleStage, string> = {
  "0_to_10k": "Stage 1 — $0 → ~$10K/mo",
  "10k_to_100k": "Stage 2 — ~$10K → ~$100K/mo",
  "100k_to_1m": "Stage 3 — ~$100K → ~$1M/mo",
};

const STORAGE = "lec-scale-roadmap-v1-progress";

function loadProgress(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE);
    const j = raw ? (JSON.parse(raw) as unknown) : {};
    return j && typeof j === "object" && !Array.isArray(j) ? (j as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

function saveProgress(done: Record<string, boolean>): void {
  try {
    window.localStorage.setItem(STORAGE, JSON.stringify(done));
  } catch {
    /* ignore */
  }
}

export function ScaleRoadmapPanel() {
  const roadmap = React.useMemo(() => buildScaleRoadmap(), []);
  const [done, setDone] = React.useState<Record<string, boolean>>({});

  React.useEffect(() => {
    setDone(loadProgress());
  }, []);

  const stages: ScaleStage[] = ["0_to_10k", "10k_to_100k", "100k_to_1m"];

  const toggle = (id: string) => {
    setDone((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      saveProgress(next);
      return next;
    });
  };

  let total = 0;
  let completed = 0;
  for (const stage of stages) {
    for (let mi = 0; mi < roadmap.stages[stage].length; mi++) {
      const m = roadmap.stages[stage][mi];
      for (let ai = 0; ai < m.actions.length; ai++) {
        total += 1;
        if (done[`${stage}-m${mi}-a${ai}`]) completed += 1;
      }
    }
  }

  return (
    <section
      className="rounded-xl border border-cyan-900/40 bg-cyan-950/20 p-4"
      data-growth-scale-roadmap-v1
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-cyan-400/90">Scale roadmap</p>
          <h3 className="mt-1 text-lg font-semibold text-zinc-100">$0 → $10K → $100K → $1M</h3>
          <p className="mt-1 max-w-xl text-[11px] text-zinc-500">
            Strategic targets — track in CRM and revenue tools. Check off execution steps locally; no auto-spend or
            pricing changes from this panel.
          </p>
        </div>
        <div className="text-right text-xs text-zinc-500">
          Action progress
          <p className="text-sm font-semibold text-cyan-200">
            {completed}/{total}
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-6">
        {stages.map((stage) => (
          <div key={stage}>
            <h4 className="text-sm font-semibold text-cyan-100/90">{STAGE_LABEL[stage]}</h4>
            <div className="mt-2 space-y-4">
              {roadmap.stages[stage].map((milestone, mi) => (
                <div
                  key={`${stage}-${milestone.title}`}
                  className="rounded-lg border border-zinc-800/90 bg-black/30 p-3"
                >
                  <p className="text-sm font-medium text-zinc-200">{milestone.title}</p>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Metrics</p>
                  <ul className="mt-1 list-inside list-disc space-y-1 text-sm text-zinc-400">
                    {milestone.metrics.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                  <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">Actions</p>
                  <ul className="mt-1 space-y-2">
                    {milestone.actions.map((action, ai) => {
                      const id = `${stage}-m${mi}-a${ai}`;
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
          </div>
        ))}
      </div>
    </section>
  );
}
