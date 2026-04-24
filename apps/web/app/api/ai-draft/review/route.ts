import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { prisma } from "@/lib/db";
import { recordAuditEvent } from "@/modules/analytics/audit-log.service";
import { loadLatestDraftInput, reviewDraftForRisks } from "@/modules/ai-drafting-correction";
import { logAiDraftAudit } from "@/modules/ai-drafting-correction/aiDraftAuditLogger";
import type { AiDraftInput } from "@/modules/ai-drafting-correction/types";
import { AI_DRAFT_RUN_TYPES } from "@/modules/ai-drafting-correction/types";
import { persistAiDraftRun, persistFindings, resolveDraftInput } from "@/modules/ai-drafting-correction/persist-run";
import {
  computeTurboDraftStatusFromFindings,
  canProceedToSign,
} from "@/modules/ai-drafting-correction/turbo-draft-gate";
import { submitForBrokerReview } from "@/modules/execution/execution.service";

export const dynamic = "force-dynamic";

/**
 * POST /api/ai-draft/review — risk findings + blocking / Turbo status (no rewrite).
 */
export async function POST(req: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  let body: { draftId?: string; input?: AiDraftInput };
  try {
    body = (await req.json()) as { draftId?: string; input?: AiDraftInput };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const draftId = typeof body.draftId === "string" ? body.draftId.trim() : "";
  if (!draftId) {
    return NextResponse.json({ error: "draftId required" }, { status: 400 });
  }

  const input = await resolveDraftInput(draftId, auth.user.id, body.input, () =>
    loadLatestDraftInput(draftId, auth.user.id)
  );
  if (!input) {
    return NextResponse.json({ error: "DRAFT_INPUT_REQUIRED" }, { status: 400 });
  }

  logAiDraftAudit("ai_draft_review_started", { draftId, userId: auth.user.id });

  const findings = await reviewDraftForRisks({ ...input, userId: auth.user.id, draftId });
  const turboDraftStatus = computeTurboDraftStatusFromFindings(findings);
  const blocking = findings.some((f) => f.blocking && f.severity === "CRITICAL");

  await persistFindings(draftId, auth.user.id, findings);
  await persistAiDraftRun({
    draftId,
    userId: auth.user.id,
    runType: AI_DRAFT_RUN_TYPES.REVIEW,
    output: { turboDraftStatus, findingCount: findings.length, blocking },
  });

  for (const f of findings) {
    if (f.blocking && f.severity === "CRITICAL") {
      logAiDraftAudit("ai_draft_blocking_finding_created", {
        draftId,
        userId: auth.user.id,
        findingKey: f.findingKey,
      });
    }
  }

  logAiDraftAudit("ai_draft_review_completed", {
    draftId,
    userId: auth.user.id,
    turboDraftStatus,
  });

  const dealId = input.transactionContext?.dealId;
  if (dealId && findings.some((f) => f.severity === "CRITICAL")) {
    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
      select: { id: true, brokerId: true, lecipmExecutionPipelineState: true },
    });
    if (deal) {
      await submitForBrokerReview({
        dealId,
        actorUserId: auth.user.id,
        ctx: { deal, userId: auth.user.id, role: auth.user.role },
      }).catch(() => undefined);
      await recordAuditEvent({
        actorUserId: auth.user.id,
        action: "AI_DRAFT_BROKER_REVIEW_QUEUED",
        payload: { draftId, dealId },
      });
    }
  }

  return NextResponse.json({
    draftId,
    findings,
    turboDraftStatus,
    blocking,
    canProceedToSign: canProceedToSign(turboDraftStatus),
  });
}
