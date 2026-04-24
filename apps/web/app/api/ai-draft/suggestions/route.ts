import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { buildSuggestionsFromFindings, loadLatestDraftInput, reviewDraftForRisks } from "@/modules/ai-drafting-correction";
import type { AiDraftInput } from "@/modules/ai-drafting-correction/types";
import { AI_DRAFT_RUN_TYPES } from "@/modules/ai-drafting-correction/types";
import { persistAiDraftRun, persistSuggestions, resolveDraftInput } from "@/modules/ai-drafting-correction/persist-run";

export const dynamic = "force-dynamic";

/**
 * POST /api/ai-draft/suggestions — actionable suggestions linked to field keys.
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

  const findings = await reviewDraftForRisks({ ...input, userId: auth.user.id, draftId });
  const suggestions = buildSuggestionsFromFindings(findings, { ...input, userId: auth.user.id, draftId });

  await persistSuggestions(draftId, auth.user.id, suggestions);
  await persistAiDraftRun({
    draftId,
    userId: auth.user.id,
    runType: AI_DRAFT_RUN_TYPES.SUGGESTIONS,
    output: { count: suggestions.length },
  });

  return NextResponse.json({ draftId, suggestions, findings });
}
