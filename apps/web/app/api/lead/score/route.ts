import { NextRequest, NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { logError } from "@/lib/logger";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { scoreSeniorLead } from "@/modules/senior-living/lead-scoring.service";
import type { LeadFeatureHints } from "@/modules/senior-living/lead-features.service";

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

/** POST — recompute score + snapshot (optional client hints). Body: { leadId, hints?: { voiceUsed?, deviceType?, source?, ... } } */
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const leadId = typeof body.leadId === "string" ? body.leadId.trim() : "";
  if (!leadId) return NextResponse.json({ error: "leadId required" }, { status: 400 });

  const userId = await getGuestId();
  const ok = await canAccessLead(userId, leadId);
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const hintsRaw = body.hints;
  let hints: LeadFeatureHints | null = null;
  if (hintsRaw && typeof hintsRaw === "object") {
    const h = hintsRaw as Record<string, unknown>;
    hints = {
      voiceUsed: h.voiceUsed === true,
      clickedBestMatch: h.clickedBestMatch === true,
      timeOnPlatformMinutes: typeof h.timeOnPlatformMinutes === "number" ? h.timeOnPlatformMinutes : undefined,
      deviceType: typeof h.deviceType === "string" ? h.deviceType : undefined,
      source: typeof h.source === "string" ? h.source : undefined,
    };
  }

  try {
    const result = await scoreSeniorLead(leadId, hints);
    return NextResponse.json({
      score: result.score,
      probability: result.probability,
      band: result.band,
      explanation: result.explanation,
    });
  } catch (e) {
    logError("[api.lead.score.post]", { error: e });
    const msg = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
