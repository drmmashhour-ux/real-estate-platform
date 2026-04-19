import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { opsAssistantApprovalFlags, platformImprovementFlags } from "@/config/feature-flags";
import { requireAdminUser } from "@/modules/analytics/services/require-admin";
import { buildApprovalExecutionOutcomeSummary } from "@/modules/platform/ops-assistant/approval-execution-results.service";
import {
  prepareGovernanceReviewState,
  submitReviewDecision,
} from "@/modules/platform/ops-assistant/approval-execution-review.service";
import type { ApprovalExecutionHumanDecision } from "@/modules/platform/ops-assistant/approval-execution-review.types";

export const dynamic = "force-dynamic";

function governanceAllowed(): boolean {
  if (!platformImprovementFlags.platformImprovementReviewV1) return false;
  return (
    opsAssistantApprovalFlags.opsAssistantApprovalPanelV1 ||
    opsAssistantApprovalFlags.opsAssistantApprovalExecutionV1
  );
}

export async function GET() {
  if (!governanceAllowed()) {
    return NextResponse.json({ error: "Feature disabled" }, { status: 404 });
  }
  const viewerId = await getGuestId();
  if (!viewerId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  if (!(await requireAdminUser(viewerId))) return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const outcomeSummary = buildApprovalExecutionOutcomeSummary();
  const state = prepareGovernanceReviewState(outcomeSummary);
  return NextResponse.json({
    outcomeSummary,
    records: state.records,
    reviewSummary: state.summary,
  });
}

const DECISIONS = new Set<ApprovalExecutionHumanDecision>(["keep", "hold", "rollback", "future_review"]);

export async function POST(req: Request) {
  if (!governanceAllowed()) {
    return NextResponse.json({ error: "Feature disabled" }, { status: 404 });
  }
  const viewerId = await getGuestId();
  if (!viewerId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  if (!(await requireAdminUser(viewerId))) return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const body = (await req.json().catch(() => null)) as {
    recordId?: unknown;
    decision?: unknown;
    notes?: unknown;
  } | null;
  const recordId = typeof body?.recordId === "string" ? body.recordId : "";
  const decision = typeof body?.decision === "string" ? (body.decision as ApprovalExecutionHumanDecision) : null;
  const notes = typeof body?.notes === "string" ? body.notes : "";

  if (!recordId || !decision || !DECISIONS.has(decision)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const res = submitReviewDecision({
    recordId,
    decision,
    notes,
    reviewerId: viewerId,
  });
  if (!res.ok) return NextResponse.json({ error: res.error }, { status: 400 });

  const outcomeSummary = buildApprovalExecutionOutcomeSummary();
  const state = prepareGovernanceReviewState(outcomeSummary);
  return NextResponse.json({
    ok: true as const,
    outcomeSummary,
    records: state.records,
    reviewSummary: state.summary,
  });
}
