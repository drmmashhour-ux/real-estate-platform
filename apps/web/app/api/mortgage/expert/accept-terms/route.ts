import { NextRequest, NextResponse } from "next/server";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { recordPlatformEvent } from "@/lib/observability";
import { requireMortgageExpertSession } from "@/modules/mortgage/services/expert-guard";

export const dynamic = "force-dynamic";

/** POST — expert accepts platform commission & conduct terms */
export async function POST(req: NextRequest) {
  const session = await requireMortgageExpertSession();
  if ("error" in session) return session.error;

  const body = await req.json().catch(() => ({}));
  const agreed = body?.agreed === true;
  if (!agreed) {
    return NextResponse.json({ error: "You must agree to the terms" }, { status: 400 });
  }

  if (session.expert.acceptedTerms) {
    return NextResponse.json({ ok: true, expert: session.expert });
  }

  const expert = await prisma.mortgageExpert.update({
    where: { id: session.expert.id },
    data: {
      acceptedTerms: true,
      acceptedAt: new Date(),
    },
  });

  void recordPlatformEvent({
    eventType: "mortgage_expert_terms_accepted",
    sourceModule: "mortgage",
    entityType: "MORTGAGE_EXPERT",
    entityId: expert.id,
    payload: { userId: session.userId },
  }).catch(() => {});

  return NextResponse.json({ ok: true, expert });
}
