"use client";

import { AutonomousTasksPanel } from "@/src/modules/autonomous-workflow-assistant/ui/AutonomousTasksPanel";

export function CriticalBlockersCard({
  tasks,
  documentId,
  onTasksChanged,
}: {
  tasks: Parameters<typeof AutonomousTasksPanel>[0]["tasks"];
  documentId?: string | null;
  onTasksChanged?: () => void | Promise<void>;
}) {
  if (!tasks.length) return null;
  return (
    <div className="rounded-xl border border-rose-500/20 bg-rose-950/20 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-rose-200/90">Critical blockers</p>
      <p className="mt-1 text-[10px] text-rose-200/60">Address these before advancing workflow.</p>
      <div className="mt-2">
        <AutonomousTasksPanel tasks={tasks} documentId={documentId} onTasksChanged={onTasksChanged} variant="compact" />
      </div>
    </div>
  );
}
