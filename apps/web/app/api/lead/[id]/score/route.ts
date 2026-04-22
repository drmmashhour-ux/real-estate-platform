import { NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { logError } from "@/lib/logger";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { getLatestLeadScore } from "@/modules/senior-living/lead-scoring.service";

export const dynamic = "force-dynamic";

async function canAccessLead(userId: string | null, leadId: string): Promise<boolean> {
  if (!userId) return false;
  const lead = await prisma.seniorLead.findUnique({
    where: { id: leadId },
    include: { residence: { select: { operatorId: true } } },
  });
  if (!lead) return false;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user) return false;
  if (user.role === PlatformRole.ADMIN) return true;
  return lead.residence.operatorId === userId;
}

/** GET — latest score row for a lead (operators + admin). */
export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const leadId = id.trim();
  if (!leadId) return NextResponse.json({ error: "id required" }, { status: 400 });

  const userId = await getGuestId();
  const ok = await canAccessLead(userId, leadId);
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const row = await getLatestLeadScore(leadId);
    if (!row) {
      return NextResponse.json({
        score: null,
        probability: null,
        band: null,
        explanation: [] as string[],
        message: "Not scored yet",
      });
    }

    const explanation = Array.isArray(row.explanationJson) ? (row.explanationJson as string[]) : [];

    return NextResponse.json({
      score: row.score,
      probability: row.probability,
      band: row.band,
      explanation,
      createdAt: row.createdAt.toISOString(),
    });
  } catch (e) {
    logError("[api.lead.id.score.get]", { error: e });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
