import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth/requireAuthenticatedUser";
import { prisma } from "@/lib/db";
import { recordAuditEvent } from "@/modules/analytics/audit-log.service";

const PRIORITY_RANK: Record<string, number> = { high: 3, medium: 2, low: 1 };

export const dynamic = "force-dynamic";

/**
 * POST /api/suggestions/list — pending proactive suggestions for the signed-in user.
 */
export async function POST(req: NextRequest) {
  const auth = await requireAuthenticatedUser(req);
  if (auth instanceof NextResponse) return auth;

  const body = (await req.json().catch(() => ({}))) as { ownerType?: string };
  const ownerType =
    typeof body.ownerType === "string" && body.ownerType.length > 0 ? body.ownerType : "solo_broker";

  const items = await prisma.lecipmProactiveSuggestion.findMany({
    where: {
      ownerType,
      ownerId: auth.id,
      dismissed: false,
      accepted: false,
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  items.sort((a, b) => (PRIORITY_RANK[b.priority] ?? 0) - (PRIORITY_RANK[a.priority] ?? 0));

  const toMark = items.filter((i) => !i.shown).map((i) => i.id);
  if (toMark.length > 0) {
    await prisma.lecipmProactiveSuggestion.updateMany({
      where: { id: { in: toMark } },
      data: { shown: true },
    });
    await recordAuditEvent({
      actorUserId: auth.id,
      action: "PROACTIVE_SUGGESTION_SHOWN",
      payload: { count: toMark.length },
    });
  }

  return NextResponse.json({ success: true, items });
}
