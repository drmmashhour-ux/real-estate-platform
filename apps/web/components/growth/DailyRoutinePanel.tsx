"use client";

import * as React from "react";

import { build14DayRoutine } from "@/modules/growth/daily-routine.service";

const STORAGE = "lec-daily-routine-v1-checkpoints";

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

type DailyRoutinePanelProps = {
  /** When true and `viewerUserId` is set, POST completion to shared accountability (flag-gated server-side). */
  executionAccountabilitySync?: boolean;
  viewerUserId?: string;
};

export function DailyRoutinePanel({
  executionAccountabilitySync,
  viewerUserId,
}: DailyRoutinePanelProps = {}) {
  const days = React.useMemo(() => build14DayRoutine(), []);
  const [selectedDay, setSelectedDay] = React.useState(1);
  const [done, setDone] = React.useState<Record<string, boolean>>({});

  React.useEffect(() => {
    setDone(loadDone());
  }, []);

  const routine = days.find((d) => d.day === selectedDay) ?? days[0];

  const toggle = (key: string) => {
    setDone((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      saveDone(next);
      const dayMatch = /^d(\d+)-/.exec(key);
      const dayNum = dayMatch ? Number(dayMatch[1]) : routine.day;
      if (executionAccountabilitySync && viewerUserId) {
        const completed = !!next[key];
        void fetch("/api/growth/execution-accountability", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            completed
              ? {
                  action: "record",
                  surfaceType: "daily_routine",
                  itemId: key,
                  completed: true,
                  dayNumber: dayNum,
                }
              : {
                  action: "clear",
                  surfaceType: "daily_routine",
                  itemId: key,
                },
          ),
        }).catch(() => {
          /* offline / flag off server */
        });
      }
      return next;
    });
  };

  let total = 0;
  let completed = 0;
  for (const d of days) {
    for (let bi = 0; bi < d.blocks.length; bi++) {
      const b = d.blocks[bi];
      for (let ai = 0; ai < b.actions.length; ai++) {
        total += 1;
        if (done[`d${d.day}-b${bi}-a${ai}`]) completed += 1;
      }
    }
  }

  return (
    <section
      className="rounded-xl border border-emerald-900/45 bg-emerald-950/15 p-4"
      data-growth-daily-routine-v1
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-emerald-300/90">
            Execution discipline — 14 days to ~$10K push
          </p>
          <h3 className="mt-1 text-lg font-semibold text-zinc-100">Daily routine</h3>
          <p className="mt-1 max-w-xl text-[11px] text-zinc-500">
            Same rhythm every day for 14 days. All actions are manual — no automation, no auto-messages. Check off what
            you complete.
          </p>
        </div>
        <div className="text-right text-xs text-zinc-500">
          Checklist progress
          <p className="text-sm font-semibold text-emerald-200">
            {completed}/{total}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-xs text-zinc-500">Day</span>
        {days.map((d) => (
          <button
            key={d.day}
            type="button"
            className={`rounded-md px-2.5 py-1 text-xs font-medium ${
              selectedDay === d.day
                ? "bg-emerald-600 text-white"
                : "border border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
            }`}
            onClick={() => setSelectedDay(d.day)}
          >
            {d.day}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-4">
        {routine.blocks.map((block, bi) => (
          <div key={block.time} className="rounded-lg border border-zinc-800/90 bg-black/30 p-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h4 className="text-sm font-semibold text-emerald-100/95">{block.time}</h4>
              <span className="text-xs text-zinc-500">{block.focus}</span>
            </div>
            <ul className="mt-2 space-y-2">
              {block.actions.map((action, ai) => {
                const key = `d${routine.day}-b${bi}-a${ai}`;
                const checked = !!done[key];
                return (
                  <li key={key} className="flex items-start gap-2 text-sm text-zinc-300">
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 shrink-0 rounded border-zinc-600"
                      checked={checked}
                      onChange={() => toggle(key)}
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
