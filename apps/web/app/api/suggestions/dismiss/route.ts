import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth/requireAuthenticatedUser";
import { prisma } from "@/lib/db";
import { recordAuditEvent } from "@/modules/analytics/audit-log.service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const auth = await requireAuthenticatedUser(req);
  if (auth instanceof NextResponse) return auth;

  const body = (await req.json().catch(() => ({}))) as { suggestionId?: string };
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
    data: { dismissed: true, shown: true },
  });

  await recordAuditEvent({
    actorUserId: auth.id,
    action: "PROACTIVE_SUGGESTION_DISMISSED",
    payload: { suggestionId: item.id },
  });

  return NextResponse.json({ success: true, item });
}
