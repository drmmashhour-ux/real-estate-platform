import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { loadLatestDraftInput, rewriteSection } from "@/modules/ai-drafting-correction";
import { logAiDraftAudit } from "@/modules/ai-drafting-correction/aiDraftAuditLogger";
import type { AiDraftInput, AiRewriteInstruction } from "@/modules/ai-drafting-correction/types";
import { AI_DRAFT_RUN_TYPES } from "@/modules/ai-drafting-correction/types";
import { persistAiDraftRun, resolveDraftInput } from "@/modules/ai-drafting-correction/persist-run";
import { simpleTextDiff } from "@/modules/ai-drafting-correction/text-diff";

const INSTRUCTIONS = new Set<AiRewriteInstruction>(["simplify", "formalize", "clarify", "shorten"]);

export const dynamic = "force-dynamic";

/**
 * POST /api/ai-draft/rewrite-section — proposal only; client must confirm before applying.
 */
export async function POST(req: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  let body: {
    draftId?: string;
    sectionKey?: string;
    instruction?: AiRewriteInstruction;
    sourceText?: string;
    input?: AiDraftInput;
    applied?: boolean;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const draftId = typeof body.draftId === "string" ? body.draftId.trim() : "";
  const sectionKey = typeof body.sectionKey === "string" ? body.sectionKey.trim() : "";
  const instruction = body.instruction;
  const sourceText = typeof body.sourceText === "string" ? body.sourceText : "";

  if (!draftId || !sectionKey) {
    return NextResponse.json({ error: "draftId and sectionKey required" }, { status: 400 });
  }

  if (body.applied === true) {
    logAiDraftAudit("ai_draft_rewrite_applied", { draftId, userId: auth.user.id, sectionKey, instruction });
    await persistAiDraftRun({
      draftId,
      userId: auth.user.id,
      runType: AI_DRAFT_RUN_TYPES.REWRITE,
      output: { sectionKey, instruction, applied: true },
    });
    return NextResponse.json({ ok: true, applied: true });
  }

  if (body.applied === false) {
    logAiDraftAudit("ai_draft_rewrite_rejected", { draftId, userId: auth.user.id, sectionKey });
    return NextResponse.json({ ok: true, applied: false });
  }

  if (!instruction || !INSTRUCTIONS.has(instruction) || !sourceText.trim()) {
    return NextResponse.json({ error: "instruction and sourceText required for proposal" }, { status: 400 });
  }

  const input = await resolveDraftInput(draftId, auth.user.id, body.input, () =>
    loadLatestDraftInput(draftId, auth.user.id)
  );
  if (!input) {
    return NextResponse.json({ error: "DRAFT_INPUT_REQUIRED" }, { status: 400 });
  }

  logAiDraftAudit("ai_draft_rewrite_requested", { draftId, userId: auth.user.id, sectionKey, instruction });

  const result = await rewriteSection({
    draftId,
    userId: auth.user.id,
    sectionKey,
    instruction,
    sourceText,
    context: { ...input, userId: auth.user.id, draftId },
  });

  await persistAiDraftRun({
    draftId,
    userId: auth.user.id,
    runType: AI_DRAFT_RUN_TYPES.REWRITE,
    output: { sectionKey, instruction, modelUsed: result.modelUsed, proposalOnly: true },
  });

  return NextResponse.json({
    draftId,
    sectionKey,
    rewrittenText: result.rewrittenText,
    diff: simpleTextDiff(sourceText, result.rewrittenText),
    modelUsed: result.modelUsed,
    protectedNoticesRestored: result.protectedNoticesRestored,
    warnings: result.warnings,
    hint: "Confirm in UI before persisting; call again with applied:true only after user approval.",
  });
}
