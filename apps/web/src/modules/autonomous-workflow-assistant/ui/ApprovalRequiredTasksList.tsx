"use client";

import { AutonomousTasksPanel } from "@/src/modules/autonomous-workflow-assistant/ui/AutonomousTasksPanel";

export function ApprovalRequiredTasksList({
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
    <div className="rounded-xl border border-amber-500/25 bg-amber-950/15 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-amber-200/90">Approval required</p>
      <p className="mt-1 text-[10px] text-amber-200/60">Explicit confirmation before restricted actions can proceed.</p>
      <div className="mt-2">
        <AutonomousTasksPanel tasks={tasks} documentId={documentId} onTasksChanged={onTasksChanged} variant="compact" />
      </div>
    </div>
  );
}
