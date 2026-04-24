"use client";

import * as React from "react";
import Link from "next/link";

type StepRow = {
  key: string;
  order: number;
  title: string;
  shortTitle: string;
  checklist: string[];
  aiSuggestions: string[];
  done: boolean;
};

type PlaybookPayload = {
  dealId: string;
  currentStep: string;
  completedSteps: string[];
  nextAction: string;
  progressPercent: number;
  steps: StepRow[];
  checklist: string[];
  aiSuggestions: string[];
  reminders: string[];
  timelineHints: string[];
  documentHints: string[];
  delays: Array<{ stepKey: string; daysOverdue: number; message: string }>;
  riskFlags: string[];
};

export function PlaybookDashboardClient({ dealId }: { dealId: string }) {
  const [data, setData] = React.useState<PlaybookPayload | null>(null);
  const [err, setErr] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setErr(null);
    const r = await fetch(`/api/deals/${dealId}/playbook`, { credentials: "include" });
    const j = await r.json();
    if (!r.ok) {
      setErr(j.error ?? "Failed to load playbook");
      setData(null);
      return;
    }
    setData(j.playbook as PlaybookPayload);
  }, [dealId]);

  React.useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold">First deal playbook</h1>
          <p className="text-muted-foreground font-mono text-xs">{dealId}</p>
          <p className="text-muted-foreground mt-2 max-w-2xl text-xs">
            Advisory workflow only — you remain responsible for OACIQ compliance. Steps advance automatically from deal signals
            (CRM, offer draft, legal artifacts, conditions, notary, payments).
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/dashboard/deals/${dealId}/offer-draft`} className="rounded-md border px-3 py-1.5 text-xs">
            Auto offer draft
          </Link>
          <Link href={`/dashboard/deals/${dealId}/investors`} className="rounded-md border px-3 py-1.5 text-xs">
            Deal investors
          </Link>
          <button type="button" className="rounded-md border px-3 py-1.5 text-xs" onClick={() => void load()}>
            Refresh
          </button>
        </div>
      </div>

      {err ? <p className="rounded border border-red-200 bg-red-50 p-3 text-red-800">{err}</p> : null}

      {!data ?
        <p className="text-muted-foreground text-xs">Loading…</p>
      : <div className="space-y-6">
          <div className="rounded-lg border p-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">Progress</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">{data.progressPercent}%</p>
              </div>
              <div className="min-w-[200px] flex-1">
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-slate-900 transition-[width]"
                    style={{ width: `${Math.min(100, Math.max(0, data.progressPercent))}%` }}
                  />
                </div>
              </div>
            </div>
            <p className="mt-4 text-xs font-semibold text-muted-foreground">Current focus</p>
            <p className="mt-1 text-base font-semibold">
              {data.steps.find((s) => s.key === data.currentStep)?.title ?? data.currentStep}
            </p>
            <p className="mt-2 rounded-md bg-muted/40 p-3 text-xs leading-relaxed">{data.nextAction}</p>
          </div>

          {data.riskFlags.length > 0 ?
            <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-4">
              <p className="text-xs font-semibold text-amber-900">Risk flags</p>
              <ul className="mt-2 list-inside list-disc text-xs text-amber-950">
                {data.riskFlags.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </div>
          : null}

          {data.delays.length > 0 ?
            <div className="rounded-lg border border-red-200 bg-red-50/50 p-4">
              <p className="text-xs font-semibold text-red-900">Delays</p>
              <ul className="mt-2 space-y-2 text-xs text-red-950">
                {data.delays.map((d) => (
                  <li key={`${d.stepKey}-${d.message}`}>
                    <span className="font-medium">{d.stepKey}</span> — {d.message}
                  </li>
                ))}
              </ul>
            </div>
          : null}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border p-4">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Checklist (this step)</p>
              <ul className="mt-2 list-inside list-disc space-y-1 text-xs leading-relaxed">
                {data.checklist.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-xs font-semibold uppercase text-muted-foreground">AI suggestions</p>
              <ul className="mt-2 list-inside list-disc space-y-1 text-xs leading-relaxed text-muted-foreground">
                {data.aiSuggestions.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>
          </div>

          {(data.reminders.length > 0 || data.timelineHints.length > 0 || data.documentHints.length > 0) ?
            <div className="rounded-lg border bg-muted/15 p-4">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Automation hints</p>
              {data.reminders.length > 0 ?
                <div className="mt-3">
                  <p className="text-[11px] font-medium text-muted-foreground">Reminders</p>
                  <ul className="mt-1 list-inside list-disc text-xs">
                    {data.reminders.map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ul>
                </div>
              : null}
              {data.timelineHints.length > 0 ?
                <div className="mt-3">
                  <p className="text-[11px] font-medium text-muted-foreground">Timelines</p>
                  <ul className="mt-1 list-inside list-disc text-xs">
                    {data.timelineHints.map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ul>
                </div>
              : null}
              {data.documentHints.length > 0 ?
                <div className="mt-3">
                  <p className="text-[11px] font-medium text-muted-foreground">Documents</p>
                  <ul className="mt-1 list-inside list-disc text-xs">
                    {data.documentHints.map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ul>
                </div>
              : null}
            </div>
          : null}

          <div className="rounded-lg border p-4">
            <p className="text-xs font-semibold uppercase text-muted-foreground">All steps</p>
            <ol className="mt-3 space-y-2">
              {data.steps.map((s) => (
                <li
                  key={s.key}
                  className={`flex flex-wrap items-baseline justify-between gap-2 rounded-md border px-3 py-2 text-xs ${
                    s.key === data.currentStep ? "border-slate-900 bg-slate-50" : "border-transparent bg-muted/20"
                  }`}
                >
                  <span className={s.done ? "text-muted-foreground line-through" : ""}>
                    <span className="tabular-nums text-muted-foreground">{s.order + 1}. </span>
                    {s.title}
                  </span>
                  <span className="shrink-0 font-medium text-[10px] uppercase text-muted-foreground">
                    {s.done ? "Done" : s.key === data.currentStep ? "Current" : "Upcoming"}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      }
    </div>
  );
}
