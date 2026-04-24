import { NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { requireUser } from "@/lib/auth/require-user";
import { storeMemoryExample } from "@/modules/ai-memory/memory-store.service";

const OUTCOMES = new Set([
  "ACCEPTED",
  "MODIFIED",
  "REJECTED",
  "SUCCESSFUL_DRAFT",
  "FAILED_DRAFT",
  "PENDING",
]);

export const dynamic = "force-dynamic";

/**
 * POST /api/ai-memory/store — broker/admin only; stores anonymized training triples.
 */
export async function POST(req: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  if (auth.user.role !== PlatformRole.BROKER && auth.user.role !== PlatformRole.ADMIN) {
    return NextResponse.json({ error: "Broker or admin required" }, { status: 403 });
  }

  let body: {
    draftId?: string;
    formKey?: string;
    inputJson?: unknown;
    aiOutputJson?: unknown;
    finalOutputJson?: unknown;
    outcome?: string;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const draftId = typeof body.draftId === "string" ? body.draftId.trim() : "";
  const formKey = typeof body.formKey === "string" ? body.formKey.trim() : "";
  const outcome = typeof body.outcome === "string" ? body.outcome.trim().toUpperCase() : "";

  if (!draftId || !formKey || !OUTCOMES.has(outcome)) {
    return NextResponse.json({ error: "draftId, formKey, and valid outcome required" }, { status: 400 });
  }
  if (body.inputJson === undefined || body.aiOutputJson === undefined || body.finalOutputJson === undefined) {
    return NextResponse.json({ error: "inputJson, aiOutputJson, finalOutputJson required" }, { status: 400 });
  }

  const { id, diff } = await storeMemoryExample({
    draftId,
    formKey,
    userId: auth.user.id,
    inputJson: body.inputJson,
    aiOutputJson: body.aiOutputJson,
    finalOutputJson: body.finalOutputJson,
    outcome,
  });

  return NextResponse.json({ id, diffSummary: diff });
}
