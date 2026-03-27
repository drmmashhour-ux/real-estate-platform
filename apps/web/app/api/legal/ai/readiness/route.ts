import { NextResponse } from "next/server";
import { getGuestId, getUserRole } from "@/lib/auth/session";
import { isDemoMode } from "@/lib/demo-mode";
import { AI_LEGAL_DISCLAIMER } from "@/lib/legal/ai-legal-disclaimer";
import { demoLegalReadiness } from "@/lib/legal/demo-legal-ai";
import { listingLegalReadinessHeuristic } from "@/lib/legal/heuristic-legal-context";
import { aiLegalReadinessNarrative } from "@/lib/legal/ai-legal-service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  if (isDemoMode()) {
    return NextResponse.json({
      ok: true,
      source: "demo" as const,
      score: demoLegalReadiness.score,
      flags: demoLegalReadiness.flags,
      recommendedFixes: demoLegalReadiness.recommendedFixes,
      narrative: demoLegalReadiness.narrative,
      disclaimer: demoLegalReadiness.disclaimer,
    });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const heuristic = listingLegalReadinessHeuristic(body);
  const role = (await getUserRole()) ?? "user";

  const r = await aiLegalReadinessNarrative({
    userId,
    role,
    listing: body,
    heuristic,
  });

  return NextResponse.json({
    ok: true,
    source: r.source,
    score: heuristic.score,
    legalReadinessScore: heuristic.score,
    flags: heuristic.flags,
    recommendedFixes: heuristic.recommendedFixes,
    narrative: r.text,
    disclaimer: AI_LEGAL_DISCLAIMER,
    logId: r.logId,
  });
}
