import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth/requireAuthenticatedUser";
import { prisma } from "@/lib/db";
import { launchSuggestionWorkflow } from "@/lib/suggestions/launch";
import { recordAuditEvent } from "@/modules/analytics/audit-log.service";

export const dynamic = "force-dynamic";

/**
 * POST /api/suggestions/accept — accept + optionally create proposed AIWorkflow.
 */
export async function POST(req: NextRequest) {
  const auth = await requireAuthenticatedUser(req);
  if (auth instanceof NextResponse) return auth;

  const body = (await req.json().catch(() => ({}))) as {
    suggestionId?: string;
    launchWorkflow?: boolean;
  };
  if (!body.suggestionId || typeof body.suggestionId !== "string") {
    return NextResponse.json({ error: "suggestionId required" }, { status: 400 });
  }

  const existing = await prisma.lecipmProactiveSuggestion.findUnique({
    where: { id: body.suggestionId },
  });
  if (!existing || existing.ownerId !== auth.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const item = await prisma.lecipmProactiveSuggestion.update({
    where: { id: body.suggestionId },
    data: { accepted: true, shown: true, dismissed: false },
  });

  await recordAuditEvent({
    actorUserId: auth.id,
    action: "PROACTIVE_SUGGESTION_ACCEPTED",
    payload: { suggestionId: item.id },
  });

  let workflow = null;
  if (body.launchWorkflow !== false && item.workflowType) {
    try {
      workflow = await launchSuggestionWorkflow(item.id, auth.id);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return NextResponse.json(
        { success: true, item, workflow: null, workflowError: msg },
        { status: 200 }
      );
    }
  }

  return NextResponse.json({ success: true, item, workflow });
}
