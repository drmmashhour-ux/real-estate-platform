import { NextResponse } from "next/server";
import { legalHubFlags } from "@/config/feature-flags";
import { requireUser } from "@/lib/auth/require-user";
import {
  LEGAL_HUB_REVIEW_DECISION,
  type LegalHubReviewDecision,
} from "@/modules/legal/legal-hub-phase2.constants";
import { reviewWorkflow } from "@/modules/legal/legal-review.service";
import { requireLegalHubReviewer } from "@/modules/legal/services/require-legal-reviewer";

export const dynamic = "force-dynamic";

/** POST JSON `{ workflowId, decision: "approve" | "reject", reason? }` — bundle decision (explicit operator action). */
export async function POST(req: Request) {
  if (!legalHubFlags.legalHubV1 || !legalHubFlags.legalReviewV1) {
    return NextResponse.json({ error: "Legal review is disabled" }, { status: 403 });
  }

  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const gate = requireLegalHubReviewer(auth.user);
  if (!gate.ok) {
    return NextResponse.json({ error: gate.reason }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const o = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
  const workflowId = typeof o.workflowId === "string" ? o.workflowId.trim() : "";
  const decisionRaw = typeof o.decision === "string" ? o.decision.trim().toLowerCase() : "";
  const reason = typeof o.reason === "string" ? o.reason : undefined;

  if (!workflowId) {
    return NextResponse.json({ error: "workflowId is required" }, { status: 400 });
  }

  let decision: LegalHubReviewDecision | null = null;
  if (decisionRaw === LEGAL_HUB_REVIEW_DECISION.APPROVE) decision = LEGAL_HUB_REVIEW_DECISION.APPROVE;
  if (decisionRaw === LEGAL_HUB_REVIEW_DECISION.REJECT) decision = LEGAL_HUB_REVIEW_DECISION.REJECT;

  if (!decision) {
    return NextResponse.json({ error: "decision must be approve or reject" }, { status: 400 });
  }

  const result = await reviewWorkflow({
    reviewerUserId: auth.user.id,
    reviewerRole: auth.user.role,
    workflowId,
    decision,
    reason,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
