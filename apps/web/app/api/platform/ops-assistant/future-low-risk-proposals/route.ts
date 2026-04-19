import { NextResponse } from "next/server";

import { getGuestId } from "@/lib/auth/session";
import { opsAssistantApprovalFlags, platformImprovementFlags } from "@/config/feature-flags";
import { requireAdminUser } from "@/modules/analytics/services/require-admin";
import type { FutureReviewCandidateCategory } from "@/modules/platform/ops-assistant/future-review-candidate.types";
import type { ProposalUpdatePatch } from "@/modules/platform/ops-assistant/future-low-risk-proposal.service";
import {
  acceptProposalToRegistry,
  archiveProposal,
  beginProposalReview,
  createProposal,
  listProposals,
  rejectProposal,
  submitProposal,
  updateProposal,
} from "@/modules/platform/ops-assistant/future-low-risk-proposal.service";

export const dynamic = "force-dynamic";

const CATEGORIES = new Set<FutureReviewCandidateCategory>([
  "workflow",
  "drafting",
  "triage_tagging",
  "reminders",
  "configuration",
  "other",
]);

function proposalsAllowed(): boolean {
  if (!platformImprovementFlags.platformImprovementReviewV1) return false;
  return (
    opsAssistantApprovalFlags.opsAssistantApprovalPanelV1 ||
    opsAssistantApprovalFlags.opsAssistantApprovalExecutionV1
  );
}

export async function GET() {
  if (!proposalsAllowed()) return NextResponse.json({ error: "Feature disabled" }, { status: 404 });
  const viewerId = await getGuestId();
  if (!viewerId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  if (!(await requireAdminUser(viewerId))) return NextResponse.json({ error: "Admin only" }, { status: 403 });

  return NextResponse.json({ proposals: listProposals({ includeArchived: false }) });
}

export async function POST(req: Request) {
  if (!proposalsAllowed()) return NextResponse.json({ error: "Feature disabled" }, { status: 404 });
  const viewerId = await getGuestId();
  if (!viewerId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  if (!(await requireAdminUser(viewerId))) return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const action = typeof body?.action === "string" ? body.action : "";

  const replyProposals = () => NextResponse.json({ proposals: listProposals({ includeArchived: false }) });

  switch (action) {
    case "create": {
      const title = typeof body.title === "string" ? body.title : "";
      const proposedActionType = typeof body.proposedActionType === "string" ? body.proposedActionType : "";
      const category = typeof body.category === "string" ? body.category : "";
      if (!CATEGORIES.has(category as FutureReviewCandidateCategory)) {
        return NextResponse.json({ error: "Invalid category." }, { status: 400 });
      }
      const res = createProposal({
        title,
        proposedActionType,
        category: category as FutureReviewCandidateCategory,
        description: typeof body.description === "string" ? body.description : undefined,
        createdByNote: typeof body.createdByNote === "string" ? body.createdByNote : undefined,
      });
      if (!res.ok) return NextResponse.json({ error: res.error }, { status: 400 });
      return NextResponse.json({ ok: true as const, id: res.id, proposals: listProposals({ includeArchived: false }) });
    }
    case "update": {
      const id = typeof body.id === "string" ? body.id : "";
      const patch = typeof body.patch === "object" && body.patch !== null ? body.patch : {};
      const res = updateProposal({ id, patch: patch as ProposalUpdatePatch });
      if (!res.ok) return NextResponse.json({ error: res.error }, { status: 400 });
      return replyProposals();
    }
    case "submit": {
      const id = typeof body.id === "string" ? body.id : "";
      const res = submitProposal(id);
      if (!res.ok) return NextResponse.json({ error: res.error }, { status: 400 });
      return replyProposals();
    }
    case "begin_review": {
      const id = typeof body.id === "string" ? body.id : "";
      const res = beginProposalReview(id);
      if (!res.ok) return NextResponse.json({ error: res.error }, { status: 400 });
      return replyProposals();
    }
    case "accept_registry": {
      const id = typeof body.id === "string" ? body.id : "";
      const res = acceptProposalToRegistry(id);
      if (!res.ok) return NextResponse.json({ error: res.error }, { status: 400 });
      return replyProposals();
    }
    case "reject": {
      const id = typeof body.id === "string" ? body.id : "";
      const res = rejectProposal({
        id,
        reason: typeof body.reason === "string" ? body.reason : undefined,
      });
      if (!res.ok) return NextResponse.json({ error: res.error }, { status: 400 });
      return replyProposals();
    }
    case "archive": {
      const id = typeof body.id === "string" ? body.id : "";
      const res = archiveProposal({
        id,
        operatorNote: typeof body.operatorNote === "string" ? body.operatorNote : undefined,
      });
      if (!res.ok) return NextResponse.json({ error: res.error }, { status: 400 });
      return replyProposals();
    }
    default:
      return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  }
}
