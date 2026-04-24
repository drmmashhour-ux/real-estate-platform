import { NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAuthenticatedUser } from "@/lib/auth/require-session";
import { generateLaunchSequence } from "@/modules/launch-sequencer/launch-sequencer.engine";
import { launchSequencerLog } from "@/modules/launch-sequencer/launch-sequencer.logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Launch Sequencer AI — scenario-based rollout planning only (no automation, no legal clearance).
 * GET returns ranked recommendations. Never throws.
 */
export async function GET() {
  try {
    const { userId } = await requireAuthenticatedUser();
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (!user || (user.role !== PlatformRole.ADMIN && user.role !== PlatformRole.BROKER)) {
      return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
    }

    const sequence = generateLaunchSequence();
    launchSequencerLog.info("api_launch_sequencer_ok", {
      recommendations: sequence.recommendations.length,
    });

    return NextResponse.json({ ok: true, sequence });
  } catch {
    launchSequencerLog.warn("api_launch_sequencer_fallback", {});
    return NextResponse.json({
      ok: true,
      sequence: {
        recommendations: [],
        summary: ["Launch sequencer temporarily unavailable — empty conservative response."],
        topBlockers: [],
        generatedAt: new Date().toISOString(),
        dataQualityNote: "API fallback path.",
      },
    });
  }
}
