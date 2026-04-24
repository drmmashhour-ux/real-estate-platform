import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { persistDraftInputSnapshot } from "@/modules/ai-drafting-correction/draft-input-store";
import type { AiDraftInput } from "@/modules/ai-drafting-correction/types";

export const dynamic = "force-dynamic";

/**
 * POST /api/ai-draft/snapshot — persist Turbo draft input for follow-up generate/review calls with draftId only.
 */
export async function POST(req: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  let body: { input?: AiDraftInput };
  try {
    body = (await req.json()) as { input?: AiDraftInput };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const input = body.input;
  if (!input?.draftId?.trim() || !input.formKey?.trim()) {
    return NextResponse.json({ error: "input.draftId and input.formKey required" }, { status: 400 });
  }

  await persistDraftInputSnapshot({
    ...input,
    userId: auth.user.id,
    draftId: input.draftId.trim(),
  });

  return NextResponse.json({ ok: true, draftId: input.draftId.trim() });
}
