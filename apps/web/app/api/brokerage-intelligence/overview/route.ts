import { NextRequest, NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { runPortfolioAnalysis } from "@/modules/brokerage-intelligence/brokerage-intelligence.engine";

export const dynamic = "force-dynamic";

const BROKER_LIKE = new Set<PlatformRole>([PlatformRole.BROKER, PlatformRole.ADMIN]);

export async function GET(_req: NextRequest) {
  try {
    const userId = await getGuestId();
    if (!userId) return NextResponse.json({ ok: false, error: "Sign in required" }, { status: 401 });
    const u = await prisma.user.findUnique({ where: { id: userId }, select: { role: true, id: true } });
    if (!u) return NextResponse.json({ ok: false, error: "Not found" }, { status: 401 });
    if (!BROKER_LIKE.has(u.role)) {
      return NextResponse.json(
        { ok: false, error: "Forbidden", disclaimer: "Brokerage portfolio intelligence is for broker or admin use." },
        { status: 403 }
      );
    }
    const analysis = await runPortfolioAnalysis({ leadSamples: [], dealSamples: [] });
    return NextResponse.json(
      {
        ok: true,
        overview: analysis,
        disclaimer:
          "Suggestions and scores are heuristics; they do not auto-assign, auto-close, or replace broker judgment. Avoid using as personal traits or discrimination.",
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { ok: false, error: "unavailable", overview: null, disclaimer: "Heuristic; not a prediction." },
      { status: 200 }
    );
  }
}
