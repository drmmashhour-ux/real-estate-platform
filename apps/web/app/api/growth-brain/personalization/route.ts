import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { scoreBuyerIntent } from "@/lib/growth-brain/buyer-intent-scorer";
import { buildGrowthBrainSnapshot } from "@/lib/growth-brain/data-source";

export const dynamic = "force-dynamic";

/**
 * Lightweight, non-creepy hints for signed-in users (session aggregates only).
 */
export async function GET(req: NextRequest) {
  const uid = await getGuestId();
  if (!uid) {
    return NextResponse.json({ hints: [], message: "Sign in for saved preferences." });
  }

  const snapshot = await buildGrowthBrainSnapshot(prisma);
  const mine = snapshot.highIntentBuyers.filter((b) => b.userId === uid).slice(0, 1);
  if (mine.length === 0) {
    return NextResponse.json({
      hints: [
        {
          kind: "explore",
          text: "Try saving listings you like — we’ll surface similar homes in your areas of interest.",
        },
      ],
    });
  }

  const scored = scoreBuyerIntent(mine[0]);
  return NextResponse.json({
    hints: [
      {
        kind: "based_on_activity",
        text:
          scored.tier === "ready" || scored.tier === "high_intent"
            ? "You’re exploring actively — open saved searches to move faster when you’re ready."
            : "Keep browsing — refine city and price to see better matches.",
      },
    ],
    tier: scored.tier,
  });
}
