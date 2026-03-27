"use client";

import { useState } from "react";

const priorityClass: Record<string, string> = {
  critical: "bg-rose-500/20 text-rose-200 ring-1 ring-rose-500/40",
  high: "bg-amber-500/15 text-amber-200 ring-1 ring-amber-400/30",
  medium: "bg-sky-500/10 text-sky-200 ring-1 ring-sky-400/25",
  low: "bg-slate-500/15 text-slate-300 ring-1 ring-white/10",
};

export function AutonomousTasksPanel({
  tasks,
  documentId,
  onTasksChanged,
  variant = "default",
}: {
  tasks: Array<{
    id: string;
    summary: string;
    taskType: string;
    priority: string;
    status: string;
    requiresApproval: boolean;
    payload?: Record<string, unknown> | null;
  }>;
  documentId?: string | null;
  onTasksChanged?: () => void | Promise<void>;
  variant?: "default" | "compact";
}) {
  const [busyId, setBusyId] = useState<string | null>(null);

  async function callAction(path: "approve-task" | "dismiss-task", taskId: string) {
    setBusyId(taskId);
    try {
      await fetch(`/api/autonomous-workflow/${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId }),
      });
      await onTasksChanged?.();
    } finally {
      setBusyId(null);
    }
  }

  if (!tasks.length) return <p className="text-xs text-slate-500">No autonomous tasks.</p>;
  const pad = variant === "compact" ? "p-2" : "p-3";
  const textTitle = variant === "compact" ? "text-[11px]" : "text-xs";

  return (
    <ul className={`space-y-2 ${textTitle}`}>
      {tasks.map((t) => {
        const pr = (t.priority ?? "medium").toLowerCase();
        const badge = priorityClass[pr] ?? priorityClass.medium;
        const pending = t.status === "pending";
        const canApprove = pending && t.requiresApproval && documentId;
        const canDismiss = pending && documentId;
        const p = (t.payload ?? {}) as {
          sourceRefs?: string[];
          recommendedAction?: string;
          why?: string;
          triggerLabel?: string;
          blockedBy?: string[];
        };
        const refs = Array.isArray(p.sourceRefs) ? p.sourceRefs.slice(0, 4) : [];
        const blocked = Array.isArray(p.blockedBy) ? p.blockedBy.slice(0, 5) : [];
        return (
          <li key={t.id} className={`rounded-lg border border-white/[0.08] bg-[#0a0b0d] ${pad} shadow-inner shadow-black/40`}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <span className={`inline-block rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${badge}`}>{t.priority}</span>
                <p className="mt-1.5 font-medium text-slate-100">{t.summary}</p>
                <p className="mt-0.5 text-[10px] text-slate-500">
                  {t.taskType}
                  {t.requiresApproval ? <span className="text-amber-300/90"> · approval required</span> : null}
                </p>
              </div>
              {documentId ? (
                <div className="flex shrink-0 gap-1.5">
                  {canApprove ? (
                    <button
                      type="button"
                      disabled={busyId === t.id}
                      onClick={() => callAction("approve-task", t.id)}
                      className="rounded-md border border-emerald-500/35 bg-emerald-500/10 px-2 py-1 text-[10px] font-medium text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-40"
                    >
                      Approve
                    </button>
                  ) : null}
                  {canDismiss ? (
                    <button
                      type="button"
                      disabled={busyId === t.id}
                      onClick={() => callAction("dismiss-task", t.id)}
                      className="rounded-md border border-white/15 bg-white/5 px-2 py-1 text-[10px] font-medium text-slate-300 hover:bg-white/10 disabled:opacity-40"
                    >
                      Dismiss
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
            {p.why ? (
              <p className="mt-2 text-[10px] leading-relaxed text-slate-400">
                <span className="font-medium text-slate-500">Why: </span>
                {p.why}
              </p>
            ) : null}
            {p.triggerLabel ? (
              <p className="mt-1 text-[10px] text-slate-500">
                <span className="font-medium text-slate-600">Trigger: </span>
                {p.triggerLabel}
              </p>
            ) : null}
            {blocked.length ? (
              <p className="mt-1 text-[10px] text-amber-200/70">
                <span className="font-medium text-slate-600">Blocked by: </span>
                {blocked.join(" · ")}
              </p>
            ) : null}
            {typeof p.recommendedAction === "string" ? (
              <p className="mt-2 border-t border-white/5 pt-2 text-[11px] leading-relaxed text-slate-400">
                <span className="font-medium text-slate-500">Next: </span>
                {p.recommendedAction.slice(0, variant === "compact" ? 200 : 280)}
                {p.recommendedAction.length > (variant === "compact" ? 200 : 280) ? "…" : ""}
              </p>
            ) : null}
            {refs.length ? (
              <p className="mt-1.5 text-[10px] text-slate-600">
                Refs: {refs.join(" · ")}
              </p>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
