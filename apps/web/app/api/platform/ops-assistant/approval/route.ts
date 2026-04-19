import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { opsAssistantApprovalFlags, platformImprovementFlags } from "@/config/feature-flags";
import { requireAdminUser } from "@/modules/analytics/services/require-admin";
import {
  approveExecutionRequest,
  createApprovalExecutionRequest,
  denyExecutionRequest,
  executeApprovedRequest,
  getDefaultApprovalSafetyContext,
  listExecutionRequests,
  listRecentApprovalAudit,
  undoExecutionRequest,
} from "@/modules/platform/ops-assistant/approval-execution.service";
import { buildFullPlatformImprovementBundle } from "@/modules/platform/platform-improvement-review.service";
import { statusesByPriorityIdFromDoc } from "@/modules/platform/platform-improvement-state.service";

export const dynamic = "force-dynamic";

function approvalReadAllowed(): boolean {
  if (!platformImprovementFlags.platformImprovementReviewV1) return false;
  return (
    opsAssistantApprovalFlags.opsAssistantApprovalPanelV1 ||
    opsAssistantApprovalFlags.opsAssistantApprovalExecutionV1
  );
}

function approvalMutationsAllowed(): boolean {
  return (
    platformImprovementFlags.platformImprovementReviewV1 &&
    opsAssistantApprovalFlags.opsAssistantApprovalExecutionV1 &&
    !opsAssistantApprovalFlags.opsAssistantApprovalKillSwitch
  );
}

export async function GET() {
  if (!approvalReadAllowed()) {
    return NextResponse.json({ error: "Feature disabled" }, { status: 404 });
  }
  const viewerId = await getGuestId();
  if (!viewerId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  if (!(await requireAdminUser(viewerId))) return NextResponse.json({ error: "Admin only" }, { status: 403 });

  return NextResponse.json({
    requests: listExecutionRequests(),
    audit: listRecentApprovalAudit(120),
  });
}

export async function POST(req: Request) {
  if (!platformImprovementFlags.platformImprovementReviewV1) {
    return NextResponse.json({ error: "Feature disabled" }, { status: 404 });
  }
  const viewerId = await getGuestId();
  if (!viewerId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  if (!(await requireAdminUser(viewerId))) return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const action = typeof body?.action === "string" ? body.action : "";

  const safety = getDefaultApprovalSafetyContext();

  if (action === "create") {
    if (!approvalMutationsAllowed()) {
      return NextResponse.json(
        { error: "Approval execution disabled or kill switch active" },
        { status: 403 },
      );
    }
    const priorityId = typeof body.priorityId === "string" ? body.priorityId : "";
    const suggestionId = typeof body.suggestionId === "string" ? body.suggestionId : "";
    if (!priorityId || !suggestionId) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    const bundle = buildFullPlatformImprovementBundle();
    const created = createApprovalExecutionRequest({
      priorityId,
      suggestionId,
      priorities: bundle.priorities,
      statusByPriorityId: statusesByPriorityIdFromDoc(),
      operatorId: viewerId,
      safety,
    });
    if (!created.ok) {
      return NextResponse.json({ error: created.error }, { status: 400 });
    }
    return NextResponse.json({ ok: true as const, request: created.request });
  }

  if (action === "approve" || action === "deny" || action === "execute" || action === "undo") {
    if (!approvalMutationsAllowed()) {
      return NextResponse.json(
        { error: "Approval execution disabled or kill switch active" },
        { status: 403 },
      );
    }
    const requestId = typeof body.requestId === "string" ? body.requestId : "";
    if (!requestId) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

    if (action === "approve") {
      const res = approveExecutionRequest({ requestId, operatorId: viewerId, safety });
      if (!res.ok) return NextResponse.json({ error: res.error }, { status: 400 });
      return NextResponse.json({ ok: true as const, request: res.request });
    }
    if (action === "deny") {
      const res = denyExecutionRequest({ requestId, operatorId: viewerId, safety });
      if (!res.ok) return NextResponse.json({ error: res.error }, { status: 400 });
      return NextResponse.json({ ok: true as const, request: res.request });
    }
    if (action === "execute") {
      const res = await executeApprovedRequest({ requestId, operatorId: viewerId, safety });
      if (!res.ok) return NextResponse.json({ error: res.error }, { status: 400 });
      return NextResponse.json({ ok: true as const, request: res.request, result: res.result });
    }
    const res = await undoExecutionRequest({ requestId, operatorId: viewerId, safety });
    if (!res.ok) return NextResponse.json({ error: res.error }, { status: 400 });
    return NextResponse.json({ ok: true as const, result: res.result });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
