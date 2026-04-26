import { NextResponse } from "next/server";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { recordCommandCenterAudit } from "@/modules/command-center/command-center-ai-audit.service";
import { requireCommandCenterActor } from "@/modules/command-center/command-center-api-guard";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const actor = await requireCommandCenterActor();
  if (!actor.ok) return actor.response;

  const body = await req.json().catch(() => ({}));
  const recommendationId = typeof body.recommendationId === "string" ? body.recommendationId : "";
  const quickActionKey = typeof body.quickActionKey === "string" ? body.quickActionKey : null;

  if (recommendationId) {
    const rec = await prisma.commandCenterRecommendation.findUnique({
      where: { id: recommendationId },
      select: { snapshotId: true },
    });
    if (!rec?.snapshotId) {
      return NextResponse.json({ error: "Recommendation not found" }, { status: 404 });
    }
    const snap = await prisma.commandCenterSnapshot.findUnique({
      where: { id: rec.snapshotId },
      select: { ownerUserId: true },
    });
    if (snap?.ownerUserId !== actor.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    await prisma.commandCenterRecommendation.update({
      where: { id: recommendationId },
      data: { actedAt: new Date(), quickActionKey },
    });
  }

  await recordCommandCenterAudit({
    actorUserId: actor.userId,
    event: "recommendation_actioned",
    payload: {
      recommendationId: recommendationId || undefined,
      quickActionKey: quickActionKey ?? undefined,
      entityType: typeof body.entityType === "string" ? body.entityType : undefined,
      entityId: typeof body.entityId === "string" ? body.entityId : undefined,
    },
  });

  return NextResponse.json({ success: true });
}
