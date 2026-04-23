import { NextRequest } from "next/server";
import { retrieveDraftingContext } from "@/lib/ai/retrieve";
import { runInternalDraftGeneration } from "@/lib/ai/internal-draft-runner";
import { validateDraft, checkConsistency } from "@/lib/compliance/draft-validation";
import { isInternalEngineAuthorized } from "@/lib/server/internal-engine-auth";

export const dynamic = "force-dynamic";

type Body = {
  formType?: string;
  facts?: Record<string, unknown>;
  listing?: { address?: string | null };
  mode?: "full" | "clause";
  clauseType?: string;
};

/**
 * POST `{ formType, facts, listing? }` → assembled draft JSON.
 * Hard rules: non-empty sources, validation, consistency — same as `generateDraft`.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.INTERNAL_API_SECRET?.trim() || process.env.CRON_SECRET?.trim();
  if (secret && !isInternalEngineAuthorized(req)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const formType = typeof body.formType === "string" ? body.formType.trim() : "";
  const facts = body.facts && typeof body.facts === "object" ? body.facts : {};
  const mode = body.mode === "clause" ? "clause" : "full";
  const clauseType = typeof body.clauseType === "string" ? body.clauseType.trim() : "";
  if (!formType) {
    return Response.json({ error: "formType required" }, { status: 400 });
  }
  if (mode === "clause" && !clauseType) {
    return Response.json({ error: "clauseType required for clause mode" }, { status: 400 });
  }

  try {
    const query =
      mode === "clause" ? `${formType} ${clauseType}` : `${formType} ${JSON.stringify(facts)}`;
    const sources = await retrieveDraftingContext(query);
    const draft = runInternalDraftGeneration({
      formType,
      facts,
      sources,
      mode,
      clauseType: mode === "clause" ? clauseType : undefined,
    });

    if (!draft.sourceUsed?.length) {
      return Response.json({ error: "NO_SOURCE_CONTEXT" }, { status: 422 });
    }

    if (mode === "clause") {
      return Response.json({
        fields: draft.fields,
        sourceUsed: draft.sourceUsed,
        formType: draft.formType,
      });
    }

    const validation = validateDraft(draft.fields);
    if (!validation.valid) {
      return Response.json({ error: "DRAFT_INVALID", details: validation.errors }, { status: 422 });
    }

    const consistency = checkConsistency({ listing: body.listing, draft: draft.fields });
    if (!consistency.valid) {
      return Response.json({ error: "CONTRADICTION_DETECTED", details: consistency.errors }, { status: 422 });
    }

    return Response.json({
      fields: draft.fields,
      sourceUsed: draft.sourceUsed,
      formType: draft.formType,
      validation,
      consistency,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "DRAFT_FAILED";
    if (msg === "NO_SOURCE_CONTEXT") {
      return Response.json({ error: msg }, { status: 422 });
    }
    throw e;
  }
}
