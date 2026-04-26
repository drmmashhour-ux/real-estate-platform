import { NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { engineFlags } from "@/config/feature-flags";
import { buildMetaLearningInsights } from "@/modules/self-evolution/meta-learning.service";

export const dynamic = "force-dynamic";

const ALLOW = new Set<PlatformRole>([PlatformRole.BROKER, PlatformRole.ADMIN]);

export async function GET() {
  try {
    const userId = await getGuestId();
    if (!userId) return NextResponse.json({ ok: false, error: "Sign in required" }, { status: 401 });
    const u = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (!u || !ALLOW.has(u.role)) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }
    if (!engineFlags.selfEvolutionV1) {
      return NextResponse.json({ ok: true, featureDisabled: true, insights: null }, { status: 200 });
    }
    const insights = await buildMetaLearningInsights();
    return NextResponse.json({ ok: true, insights, disclaimer: insights.disclaimer }, { status: 200 });
  } catch {
    return NextResponse.json({ ok: false, insights: null }, { status: 200 });
  }
}
