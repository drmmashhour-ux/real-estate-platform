import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { requireDocumentAccess } from "@/app/api/legal-workflow/_auth";
import { listWorkflowTasks } from "@/src/modules/autonomous-workflow-assistant/infrastructure/workflowAutomationRepository";
import {
  groupTasksForDisplay,
  filterApprovalRequired,
  filterTasksBlockersOnly,
  sortTasksByPriorityThenAge,
  type WorkflowTaskRow,
} from "@/src/modules/autonomous-workflow-assistant/infrastructure/taskGroupingService";
import type { AutonomousWorkflowTaskStatus } from "@prisma/client";

export async function GET(req: Request) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "sign in required" }, { status: 401 });
  const url = new URL(req.url);
  const documentId = url.searchParams.get("documentId");
  const admin = await isPlatformAdmin(userId);
  if (!documentId && !admin) return NextResponse.json({ error: "documentId required" }, { status: 400 });
  if (documentId) {
    const auth = await requireDocumentAccess(documentId);
    if (!auth.ok) return NextResponse.json({ error: "forbidden" }, { status: auth.status });
  }

  const pendingOnly = url.searchParams.get("pendingOnly") === "1";
  const approvalOnly = url.searchParams.get("approvalOnly") === "1";
  const blockersOnly = url.searchParams.get("blockersOnly") === "1";
  const grouped = url.searchParams.get("grouped") === "1";
  const includeResolved = url.searchParams.get("includeResolved") === "1";

  const resolvedStatuses: AutonomousWorkflowTaskStatus[] = ["completed", "dismissed", "approved"];

  let raw;
  if (!documentId) {
    raw = await listWorkflowTasks(undefined);
  } else if (pendingOnly) {
    raw = await listWorkflowTasks({ documentId, status: "pending" });
  } else if (includeResolved) {
    raw = await listWorkflowTasks({
      documentId,
      statusIn: (["pending", ...resolvedStatuses] as const).filter(Boolean) as AutonomousWorkflowTaskStatus[],
    });
  } else {
    raw = await listWorkflowTasks({ documentId });
  }

  const rows = raw as unknown as WorkflowTaskRow[];

  if (grouped && documentId) {
    const pending = rows.filter((t) => t.status === "pending");
    const sortedPending = sortTasksByPriorityThenAge(pending);
    const approvalRequired = filterApprovalRequired(sortedPending);
    const approvalIds = new Set(approvalRequired.map((t) => t.id));
    const criticalBlockers = sortedPending.filter((t) => t.priority === "critical" && !approvalIds.has(t.id));
    const handledIds = new Set([...criticalBlockers.map((t) => t.id), ...approvalRequired.map((t) => t.id)]);
    const forGrouping = sortedPending.filter((t) => !handledIds.has(t.id));
    const resolvedRecent = sortTasksByPriorityThenAge(
      rows.filter((t) => t.status !== "pending" && resolvedStatuses.includes(t.status as AutonomousWorkflowTaskStatus)),
    ).slice(0, 12);
    const { groups, standalone } = groupTasksForDisplay(forGrouping);

    let filtered = sortedPending;
    if (approvalOnly) filtered = filterApprovalRequired(sortedPending);
    else if (blockersOnly) filtered = filterTasksBlockersOnly(sortedPending);

    return NextResponse.json({
      tasks: filtered,
      groups,
      standalone,
      criticalBlockers,
      approvalRequired,
      resolvedRecent,
      all: rows,
    });
  }

  let tasks = rows;
  if (approvalOnly) tasks = filterApprovalRequired(rows.filter((t) => t.status === "pending"));
  else if (blockersOnly) tasks = filterTasksBlockersOnly(rows.filter((t) => t.status === "pending"));
  else tasks = sortTasksByPriorityThenAge(rows);

  return NextResponse.json({ tasks });
}
