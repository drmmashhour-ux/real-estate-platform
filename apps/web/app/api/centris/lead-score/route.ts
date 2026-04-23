import { NextRequest } from "next/server";

import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { brokerCanAccessCentrisLead } from "@/modules/centris-conversion/centris-access.guard";
import { computeCentrisLeadScore } from "@/modules/centris-conversion/centris-lead-score.service";

export const dynamic = "force-dynamic";

/** GET ?leadId= — broker/admin only; returns deterministic Centris funnel score intent. */
export async function GET(req: NextRequest) {
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  const leadId = req.nextUrl.searchParams.get("leadId")?.trim();
  if (!leadId) return Response.json({ error: "leadId required" }, { status: 400 });

  const ok = await brokerCanAccessCentrisLead(userId, user?.role, leadId);
  if (!ok) return Response.json({ error: "Forbidden" }, { status: 403 });

  const computed = await computeCentrisLeadScore(leadId);

  const persisted = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { aiExplanation: true },
  });

  const centris =
    persisted?.aiExplanation &&
    typeof persisted.aiExplanation === "object" &&
    persisted.aiExplanation !== null &&
    "centris" in persisted.aiExplanation
      ? (persisted.aiExplanation as Record<string, unknown>).centris
      : null;

  return Response.json({
    computed,
    persistedExplanation: centris ?? null,
  });
}
