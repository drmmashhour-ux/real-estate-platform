import { NextRequest, NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { getRevenueLoopForLead } from "@/modules/monetization/revenue-loop.service";

export const dynamic = "force-dynamic";

const ALLOW = new Set<PlatformRole>([PlatformRole.BROKER, PlatformRole.ADMIN]);

/**
 * GET ?leadId= — similar marketplace leads, real urgency, subscription/bundle hints (value-first, transparent).
 */
export async function GET(req: NextRequest) {
  try {
    const userId = await getGuestId();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Sign in required" }, { status: 401 });
    }
    const { searchParams } = new URL(req.url);
    const leadId = searchParams.get("leadId")?.trim() ?? "";
    if (!leadId) {
      return NextResponse.json({ ok: false, error: "leadId required" }, { status: 400 });
    }
    const u = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (!u || !ALLOW.has(u.role)) {
      return NextResponse.json({ ok: false, error: "Broker or admin only" }, { status: 403 });
    }
    const data = await getRevenueLoopForLead(leadId, userId);
    return NextResponse.json({ ok: true, data });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "unavailable" },
      { status: 200 }
    );
  }
}
