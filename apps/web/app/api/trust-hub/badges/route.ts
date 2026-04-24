import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateTrustBadges } from "@/modules/quebec-trust-hub/trustBadges";
import { requireUser } from "@/lib/auth/require-user";

import { logTrustHubEvent } from "@/modules/quebec-trust-hub/trustHubAuditLogger";

export async function POST(req: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  try {
    const { draftId } = await req.json();

    // @ts-ignore
    const draft = await prisma.turboDraft.findUnique({
      where: { id: draftId }
    });

    if (!draft) return NextResponse.json({ error: "Draft not found" }, { status: 404 });

    const input = draft.contextJson as any;
    const result = draft.resultJson as any;

    const badges = generateTrustBadges(input, result);

    // Persist badges
    for (const badge of badges) {
      // @ts-ignore
      await prisma.trustHubBadge.upsert({
        where: { draftId_badgeKey: { draftId, badgeKey: badge.badgeKey } },
        update: { labelFr: badge.labelFr, proofJson: badge.proofJson as any },
        create: { 
          draftId, 
          userId: auth.user.id, 
          badgeKey: badge.badgeKey, 
          labelFr: badge.labelFr, 
          proofJson: badge.proofJson as any 
        }
      });

      await logTrustHubEvent({
        draftId,
        userId: auth.user.id,
        eventKey: "trust_badge_granted",
        severity: "SUCCESS",
        payload: { badgeKey: badge.badgeKey }
      });
    }

    return NextResponse.json(badges);
  } catch (err) {
    return NextResponse.json({ error: "Failed to generate badges" }, { status: 500 });
  }
}
