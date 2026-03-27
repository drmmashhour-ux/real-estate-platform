"use client";

import type { ReactNode } from "react";
import { CriticalBlockersCard } from "@/src/modules/autonomous-workflow-assistant/ui/CriticalBlockersCard";
import { ApprovalRequiredTasksList } from "@/src/modules/autonomous-workflow-assistant/ui/ApprovalRequiredTasksList";
import { AutonomousTasksPanel } from "@/src/modules/autonomous-workflow-assistant/ui/AutonomousTasksPanel";
import type { TaskDisplayGroup } from "@/src/modules/autonomous-workflow-assistant/infrastructure/taskGroupingService";

type TaskRow = Parameters<typeof AutonomousTasksPanel>[0]["tasks"][number];

export function AutonomousTaskReviewPanel({
  documentId,
  onTasksChanged,
  criticalBlockers,
  approvalRequired,
  resolvedRecent,
  groups,
  standalone,
  signatureReadinessSlot,
}: {
  documentId: string | null;
  onTasksChanged?: () => void | Promise<void>;
  criticalBlockers: TaskRow[];
  approvalRequired: TaskRow[];
  resolvedRecent: TaskRow[];
  groups: TaskDisplayGroup[];
  standalone: TaskRow[];
  /** Optional checklist (e.g. signature) rendered once at top when relevant */
  signatureReadinessSlot?: ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-semibold text-white">Workflow assistant</p>
        <p className="text-[10px] text-slate-500">Pending items, blockers, and safe recommendations — nothing finalizes automatically.</p>
      </div>

      {signatureReadinessSlot}

      <CriticalBlockersCard tasks={criticalBlockers} documentId={documentId} onTasksChanged={onTasksChanged} />
      <ApprovalRequiredTasksList tasks={approvalRequired} documentId={documentId} onTasksChanged={onTasksChanged} />

      {groups.map((g) => (
        <div key={g.id} className="rounded-xl border border-white/10 bg-black/20 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{g.title}</p>
          <div className="mt-2">
            <AutonomousTasksPanel tasks={g.tasks} documentId={documentId} onTasksChanged={onTasksChanged} variant="compact" />
          </div>
        </div>
      ))}

      {standalone.length ? (
        <div className="rounded-xl border border-white/10 bg-black/15 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Other pending</p>
          <div className="mt-2">
            <AutonomousTasksPanel tasks={standalone} documentId={documentId} onTasksChanged={onTasksChanged} />
          </div>
        </div>
      ) : null}

      {resolvedRecent.length ? (
        <div className="rounded-xl border border-white/5 bg-black/25 p-3 opacity-90">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Recently resolved</p>
          <ul className="mt-2 space-y-1 text-[10px] text-slate-500">
            {resolvedRecent.map((t) => (
              <li key={t.id} className="flex justify-between gap-2 border-b border-white/5 pb-1 last:border-0">
                <span className="truncate text-slate-400">{t.summary}</span>
                <span className="shrink-0 uppercase text-slate-600">{t.status}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
