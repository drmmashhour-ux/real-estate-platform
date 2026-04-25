import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getTrustBadges } from "../../../../modules/quebec-trust-hub/trustBadges";
import { logTrustHubEvent } from "../../../../modules/quebec-trust-hub/trustHubAuditLogger";

export async function POST(req: NextRequest) {
  try {
    const { draftId } = await req.json();
    if (!draftId) return NextResponse.json({ error: "Missing draftId" }, { status: 400 });

    const draft = await prisma.turboDraft.findUnique({
      where: { id: draftId },
    });

    if (!draft) return NextResponse.json({ error: "Draft not found" }, { status: 404 });

    const acks = await prisma.turboDraftAcknowledgement.findMany({
      where: { draftId },
    });

    const context = {
      ...(draft.contextJson as any),
      resultJson: draft.resultJson,
      acknowledgements: acks,
    };

    const badges = getTrustBadges(context);

    // Persist badges (Cleanup and insert)
    await prisma.trustHubBadge.deleteMany({ where: { draftId } });
    if (badges.length > 0) {
      await prisma.trustHubBadge.createMany({
        data: badges.map(b => ({
          draftId,
          userId: draft.userId,
          badgeKey: b.badgeKey,
          labelFr: b.labelFr,
          proofJson: b.proofJson as any,
        })),
      });
    }

    await logTrustHubEvent({
      draftId,
      userId: draft.userId || undefined,
      eventKey: "trust_badge_granted",
      payload: { count: badges.length },
    });

    return NextResponse.json(badges);
  } catch (error: any) {
    console.error("[TRUST_HUB_BADGES]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
