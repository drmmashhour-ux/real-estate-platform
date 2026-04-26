import { NextResponse } from "next/server";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { getGuestId } from "@/lib/auth/session";
import { storeFeedbackSignal } from "@/modules/ai-training/application/storeFeedbackSignal";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const userId = await getGuestId().catch(() => null);
  const body = await req.json().catch(() => ({}));
  const subsystem = typeof body?.subsystem === "string" ? body.subsystem : "";
  const entityType = typeof body?.entityType === "string" ? body.entityType : "";
  const entityId = typeof body?.entityId === "string" ? body.entityId : "";
  const promptOrQuery = typeof body?.promptOrQuery === "string" ? body.promptOrQuery : "";
  const outputSummary = typeof body?.outputSummary === "string" ? body.outputSummary : "";
  if (!subsystem || !entityType || !entityId || !promptOrQuery || !outputSummary) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  const event = await storeFeedbackSignal(prisma, {
    subsystem,
    entityType,
    entityId,
    userId,
    promptOrQuery,
    outputSummary,
    rating: typeof body?.rating === "number" ? body.rating : null,
    accepted: typeof body?.accepted === "boolean" ? body.accepted : null,
    actionTaken: typeof body?.actionTaken === "string" ? body.actionTaken : null,
    metadata: body?.metadata && typeof body.metadata === "object" ? body.metadata : null,
  });
  return NextResponse.json({ ok: true, id: event.id });
}
