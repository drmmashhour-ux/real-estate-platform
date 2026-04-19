import { NextResponse } from "next/server";

import { getGuestId } from "@/lib/auth/session";
import { opsAssistantApprovalFlags, platformImprovementFlags } from "@/config/feature-flags";
import { requireAdminUser } from "@/modules/analytics/services/require-admin";
import {
  addFutureReviewCandidate,
  listFutureReviewCandidates,
} from "@/modules/platform/ops-assistant/future-review-candidate.service";
import type { FutureReviewCandidateCategory } from "@/modules/platform/ops-assistant/future-review-candidate.types";

export const dynamic = "force-dynamic";

function registryAllowed(): boolean {
  if (!platformImprovementFlags.platformImprovementReviewV1) return false;
  return (
    opsAssistantApprovalFlags.opsAssistantApprovalPanelV1 ||
    opsAssistantApprovalFlags.opsAssistantApprovalExecutionV1
  );
}

export async function GET() {
  if (!registryAllowed()) {
    return NextResponse.json({ error: "Feature disabled" }, { status: 404 });
  }
  const viewerId = await getGuestId();
  if (!viewerId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  if (!(await requireAdminUser(viewerId))) return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const candidates = listFutureReviewCandidates({ includeArchived: false });
  return NextResponse.json({ candidates });
}

const CATEGORIES = new Set<FutureReviewCandidateCategory>([
  "workflow",
  "drafting",
  "triage_tagging",
  "reminders",
  "configuration",
  "other",
]);

export async function POST(req: Request) {
  if (!registryAllowed()) {
    return NextResponse.json({ error: "Feature disabled" }, { status: 404 });
  }
  const viewerId = await getGuestId();
  if (!viewerId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  if (!(await requireAdminUser(viewerId))) return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const actionType = typeof body?.actionType === "string" ? body.actionType : "";
  const description = typeof body?.description === "string" ? body.description : "";
  const whyAdjacentLowRisk = typeof body?.whyAdjacentLowRisk === "string" ? body.whyAdjacentLowRisk : "";
  const evidenceNarrative = typeof body?.evidenceNarrative === "string" ? body.evidenceNarrative : "";
  const auditHealthSummary = typeof body?.auditHealthSummary === "string" ? body.auditHealthSummary : "";
  const category = typeof body?.category === "string" ? body.category : undefined;
  const notes = typeof body?.notes === "string" ? body.notes : undefined;

  if (!actionType.trim() || !description.trim() || !whyAdjacentLowRisk.trim() || !evidenceNarrative.trim()) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }
  if (category && !CATEGORIES.has(category as FutureReviewCandidateCategory)) {
    return NextResponse.json({ error: "Invalid category." }, { status: 400 });
  }

  const res = addFutureReviewCandidate({
    actionType,
    category: category as FutureReviewCandidateCategory | undefined,
    description,
    whyAdjacentLowRisk,
    evidenceSummary: { narrative: evidenceNarrative },
    auditHealthSummary: auditHealthSummary.trim() || "Operator intake — audit posture not yet assessed.",
    notes,
    initialStatus: "proposed",
  });

  if (!res.ok) return NextResponse.json({ error: res.error }, { status: 400 });

  const candidates = listFutureReviewCandidates({ includeArchived: false });
  return NextResponse.json({ ok: true as const, id: res.id, candidates });
}
