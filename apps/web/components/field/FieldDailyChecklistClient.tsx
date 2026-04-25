"use client";

import type { ComponentType } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Circle, Phone, Presentation, BarChart2 } from "lucide-react";
import {
  CHECKLIST_DOS,
  CHECKLIST_DONTS,
  FIELD_DAILY_BLOCKS,
  type ChecklistBlock,
} from "@/modules/field/field-daily-checklist.data";
import {
  loadChecklistState,
  saveChecklistState,
  type ChecklistDayState,
  type DailyKpi,
} from "./field-daily-checklist-storage";
import { cn } from "@/lib/utils";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function useNowTick(ms: number) {
  const [n, setN] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setN(new Date()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return n;
}

function countTasks(blocks: ChecklistBlock[]) {
  return blocks.filter((b) => b.kind === "work").reduce((a, b) => a + b.tasks.length, 0);
}

function countDone(state: ChecklistDayState, blocks: ChecklistBlock[]) {
  let n = 0;
  for (const b of blocks) {
    if (b.kind === "break") continue;
    for (const t of b.tasks) {
      if (state.done[b.id]?.[t.id]) n++;
    }
  }
  return n;
}

function getAlerts(now: Date, kpi: DailyKpi) {
  const h = now.getHours();
  const m = now.getMinutes();
  const out: { id: string; text: string }[] = [];
  if ((h > 12 || (h === 12 && m >= 0)) && kpi.demos < 2) {
    out.push({ id: "demos2", text: "⚠️ You need at least 2 demos today" });
  }
  if (h >= 10 && kpi.calls < 5) {
    out.push({ id: "outreach", text: "⚠️ Increase outreach now" });
  }
  return out;
}

type DayScore = "good" | "average" | "needs_improvement";

function endOfDayScore(kpi: DailyKpi, taskPercent: number): { label: DayScore; fr: string } {
  if (kpi.demos >= 2 && kpi.calls >= 10) {
    if (kpi.conversions > 0 || taskPercent >= 0.7) return { label: "good", fr: "Bon" };
    return { label: "average", fr: "Moyen" };
  }
  if (kpi.demos >= 1 && kpi.calls >= 6) return { label: "average", fr: "Moyen" };
  if (kpi.demos < 1 || kpi.calls < 5) return { label: "needs_improvement", fr: "À améliorer" };
  return { label: "average", fr: "Moyen" };
}

export function FieldDailyChecklistClient() {
  const now = useNowTick(30_000);
  const dateKey = useMemo(() => todayKey(), []);
  const [state, setState] = useState<ChecklistDayState | null>(null);

  useEffect(() => {
    setState(loadChecklistState(dateKey));
  }, [dateKey]);

  const persist = useCallback((next: ChecklistDayState) => {
    setState(next);
    saveChecklistState(next);
  }, []);

  const workBlocks = useMemo(() => FIELD_DAILY_BLOCKS, []);
  const totalWorkTasks = useMemo(() => countTasks(FIELD_DAILY_BLOCKS), []);
  const workDone = state ? countDone(state, FIELD_DAILY_BLOCKS) : 0;
  const taskPercent = totalWorkTasks > 0 ? workDone / totalWorkTasks : 0;
  const alerts = state ? getAlerts(now, state.kpi) : [];

  const toggleTask = (blockId: string, taskId: string) => {
    if (!state) return;
    const d = { ...state.done };
    const row = { ...(d[blockId] ?? {}) };
    row[taskId] = !row[taskId];
    d[blockId] = row;
    persist({ ...state, done: d });
  };

  const setKpi = (k: Partial<DailyKpi>) => {
    if (!state) return;
    persist({ ...state, kpi: { ...state.kpi, ...k } });
  };

  const setNotes = (notes: string) => {
    if (!state) return;
    persist({ ...state, notes });
  };

  if (!state) {
    return <p className="text-sm text-zinc-500">Chargement…</p>;
  }

  const eod = endOfDayScore(state.kpi, taskPercent);
  const eodClass =
    eod.label === "good" ? "text-emerald-300" : eod.label === "average" ? "text-amber-200" : "text-rose-300";

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiInput label="Appels" value={state.kpi.calls} onChange={(v) => setKpi({ calls: v })} icon={Phone} />
        <KpiInput label="Démos" value={state.kpi.demos} onChange={(v) => setKpi({ demos: v })} icon={Presentation} />
        <KpiInput
          label="Conversions"
          value={state.kpi.conversions}
          onChange={(v) => setKpi({ conversions: v })}
          icon={BarChart2}
        />
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 text-sm text-zinc-400">
          <p className="text-[10px] font-bold uppercase text-zinc-500">Journée</p>
          <p className="mt-1 text-zinc-200">{dateKey}</p>
        </div>
      </div>

      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((a) => (
            <p key={a.id} className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-sm text-amber-100">
              {a.text}
            </p>
          ))}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr,280px]">
        <div>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">Chronologie</h2>
          <div className="relative pl-2">
            {workBlocks.map((b, i) => (
              <BlockRow
                key={b.id}
                block={b}
                isLast={i === workBlocks.length - 1}
                state={state}
                onToggle={toggleTask}
              />
            ))}
          </div>
        </div>
        <aside className="space-y-4">
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400/80">À faire</h3>
            <ul className="mt-2 space-y-1.5 text-sm text-zinc-200">
              {CHECKLIST_DOS.map((x) => (
                <li key={x} className="flex gap-2">
                  <span className="text-emerald-400">✔</span> {x}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-rose-300/80">À éviter</h3>
            <ul className="mt-2 space-y-1.5 text-sm text-zinc-200">
              {CHECKLIST_DONTS.map((x) => (
                <li key={x} className="flex gap-2">
                  <span className="text-rose-300">❌</span> {x}
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Notes</h2>
        <textarea
          className="mt-2 min-h-[100px] w-full rounded-lg border border-zinc-800 bg-zinc-950/80 p-3 text-sm text-zinc-100"
          value={state.notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Obstacles, comptes chauds, rappels pour demain…"
        />
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Bilan fin de journée</h2>
        <div className="mt-2 grid gap-3 sm:grid-cols-3 text-sm">
          <div>
            <p className="text-xs text-zinc-500">Appels (total saisi)</p>
            <p className="text-lg font-mono text-zinc-100">{state.kpi.calls}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Démos</p>
            <p className="text-lg font-mono text-zinc-100">{state.kpi.demos}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Conversions</p>
            <p className="text-lg font-mono text-zinc-100">{state.kpi.conversions}</p>
          </div>
        </div>
        <p className="mt-3 text-sm text-zinc-400">
          Tâches complétées : {Math.round(taskPercent * 100)}% · Score :{" "}
          <span className={cn("font-semibold", eodClass)}>{eod.fr}</span>{" "}
          <span className="text-zinc-500">({eod.label})</span>
        </p>
      </section>
    </div>
  );
}

function KpiInput({
  label,
  value,
  onChange,
  icon: Icon,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3">
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-zinc-500">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <input
        type="number"
        min={0}
        className="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1 font-mono text-lg text-zinc-100"
        value={value}
        onChange={(e) => onChange(Math.max(0, parseInt(e.target.value, 10) || 0))}
      />
    </div>
  );
}

function BlockRow({
  block,
  isLast,
  state,
  onToggle,
}: {
  block: ChecklistBlock;
  isLast: boolean;
  state: ChecklistDayState;
  onToggle: (b: string, t: string) => void;
}) {
  const isBreak = block.kind === "break";
  const doneMap = state.done[block.id] ?? {};
  const doneCount = block.tasks.filter((t) => doneMap[t.id]).length;
  const pct = block.tasks.length > 0 ? (doneCount / block.tasks.length) * 100 : 0;
  return (
    <div className="relative flex gap-3 pb-8">
      {!isLast && <div className="absolute left-[15px] top-6 bottom-0 w-px bg-zinc-800" aria-hidden />}
      <div
        className={cn(
          "relative z-0 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[9px] font-bold tabular-nums",
          isBreak ? "bg-zinc-800 text-zinc-500" : "bg-amber-500/20 text-amber-300",
        )}
      >
        {isBreak ? "⏸" : `${Math.round(pct)}%`}
      </div>
      <div
        className={cn(
          "min-w-0 flex-1 rounded-xl border p-3",
          isBreak ? "border-zinc-800/60 bg-zinc-900/20" : "border-zinc-800 bg-zinc-900/40",
        )}
      >
        <p className="text-xs font-mono text-amber-200/80">{block.timeLabel}</p>
        <h3 className="font-medium text-zinc-100">{block.title}</h3>
        {block.subtitle && <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{block.subtitle}</p>}
        {block.goalLine && <p className="mt-1 text-sm text-amber-200/80">{block.goalLine}</p>}
        {block.rules && (
          <ul className="mt-1 list-inside list-disc text-xs text-zinc-500">
            {block.rules.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        )}
        {!isBreak && (
          <div className="mb-1 mt-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
            <div className="h-full bg-amber-500/80 transition-all" style={{ width: `${pct}%` }} />
          </div>
        )}
        <ul className="mt-2 space-y-2">
          {block.tasks.map((t) => {
            const on = doneMap[t.id] ?? false;
            return (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => onToggle(block.id, t.id)}
                  className="flex w-full items-start gap-2 rounded-lg p-1 text-left text-sm text-zinc-200 hover:bg-zinc-800/50"
                >
                  {on ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                  ) : (
                    <Circle className="mt-0.5 h-4 w-4 shrink-0 text-zinc-600" />
                  )}
                  {t.label}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
