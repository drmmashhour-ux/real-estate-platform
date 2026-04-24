import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import {
  generateAiDraft,
  loadLatestDraftInput,
  persistDraftInputSnapshot,
} from "@/modules/ai-drafting-correction";
import { logAiDraftAudit } from "@/modules/ai-drafting-correction/aiDraftAuditLogger";
import type { AiDraftInput } from "@/modules/ai-drafting-correction/types";
import { AI_DRAFT_RUN_TYPES } from "@/modules/ai-drafting-correction/types";
import { outputToJson, persistAiDraftRun, persistFindings, resolveDraftInput } from "@/modules/ai-drafting-correction/persist-run";

export const dynamic = "force-dynamic";

/**
 * POST /api/ai-draft/generate — improved draft + findings (does not sign or waive gates).
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
    return NextResponse.json(
      { error: "DRAFT_INPUT_REQUIRED", hint: "Send input snapshot first or call with full input object." },
      { status: 400 }
    );
  }

  logAiDraftAudit("ai_draft_generate_started", { draftId, userId: auth.user.id });

  if (body.input) {
    await persistDraftInputSnapshot({ ...input, userId: auth.user.id, draftId });
  }

  const out = await generateAiDraft({ ...input, userId: auth.user.id, draftId });

  await persistAiDraftRun({
    draftId,
    userId: auth.user.id,
    runType: AI_DRAFT_RUN_TYPES.GENERATE,
    input: { formKey: input.formKey },
    output: outputToJson(out),
  });
  await persistFindings(draftId, auth.user.id, out.findings);

  for (const f of out.findings) {
    if (f.blocking && f.severity === "CRITICAL") {
      logAiDraftAudit("ai_draft_blocking_finding_created", {
        draftId,
        userId: auth.user.id,
        findingKey: f.findingKey,
      });
    }
  }

  logAiDraftAudit("ai_draft_generate_completed", {
    draftId,
    userId: auth.user.id,
    turboDraftStatus: out.turboDraftStatus,
    findingCount: out.findings.length,
  });

  return NextResponse.json({
    draftId,
    improvedSections: out.improvedSections,
    improvedHtml: out.improvedHtml,
    missingFactMarkers: out.missingFactMarkers,
    findings: out.findings,
    turboDraftStatus: out.turboDraftStatus,
    canProceedToSign: out.turboDraftStatus === "READY_TO_SIGN",
    modelUsed: out.modelUsed,
    warnings: out.warnings,
  });
}
