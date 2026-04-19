import { NextResponse } from "next/server";

import { getGuestId } from "@/lib/auth/session";
import { opsAssistantApprovalFlags, platformImprovementFlags } from "@/config/feature-flags";
import { requireAdminUser } from "@/modules/analytics/services/require-admin";
import {
  archiveFutureReviewCandidate,
  listFutureReviewCandidates,
  updateFutureReviewCandidateStatus,
} from "@/modules/platform/ops-assistant/future-review-candidate.service";
import type { FutureReviewCandidateStatus } from "@/modules/platform/ops-assistant/future-review-candidate.types";

export const dynamic = "force-dynamic";

const MUTATING: FutureReviewCandidateStatus[] = ["held", "rejected", "archived"];

function registryAllowed(): boolean {
  if (!platformImprovementFlags.platformImprovementReviewV1) return false;
  return (
    opsAssistantApprovalFlags.opsAssistantApprovalPanelV1 ||
    opsAssistantApprovalFlags.opsAssistantApprovalExecutionV1
  );
}

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  if (!registryAllowed()) {
    return NextResponse.json({ error: "Feature disabled" }, { status: 404 });
  }
  const viewerId = await getGuestId();
  if (!viewerId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  if (!(await requireAdminUser(viewerId))) return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const { id } = await context.params;
  const decodedId = decodeURIComponent(id);

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const action = typeof body?.action === "string" ? body.action : "";

  let nextStatus: FutureReviewCandidateStatus | null = null;
  if (action === "hold") nextStatus = "held";
  else if (action === "reject") nextStatus = "rejected";
  else if (action === "archive") nextStatus = "archived";
  else if (typeof body?.nextStatus === "string") {
    const raw = body.nextStatus as FutureReviewCandidateStatus;
    if (MUTATING.includes(raw)) nextStatus = raw;
  }

  if (!nextStatus) {
    return NextResponse.json({ error: "Use action: hold | reject | archive" }, { status: 400 });
  }

  const operatorNote = typeof body?.operatorNote === "string" ? body.operatorNote : "";

  const res =
    nextStatus === "archived"
      ? archiveFutureReviewCandidate({ id: decodedId, operatorNote })
      : updateFutureReviewCandidateStatus({
          id: decodedId,
          nextStatus,
          operatorNote,
        });

  if (!res.ok) return NextResponse.json({ error: res.error }, { status: 400 });

  const candidates = listFutureReviewCandidates({ includeArchived: false });
  return NextResponse.json({ ok: true as const, candidates });
}
