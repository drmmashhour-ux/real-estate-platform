import { NextResponse } from "next/server";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { lecipmLaunchInvestorFlags } from "@/config/feature-flags";
import { requirePlatformLaunchInvestor } from "@/lib/launch-investor-api-auth";
import { logGrowthEngineAudit } from "@/modules/growth-engine-audit/growth-engine-audit.service";

export const dynamic = "force-dynamic";

type Body = {
  userId?: string;
  note?: string;
};

/**
 * Manual founder note tied to a user — does not override computed activation; audit only.
 */
export async function POST(request: Request) {
  const auth = await requirePlatformLaunchInvestor();
  if (!auth.ok) return auth.response;
  if (!lecipmLaunchInvestorFlags.earlyTractionV1) {
    return NextResponse.json({ error: "Early traction module disabled" }, { status: 403 });
  }

  let body: Body = {};
  try {
    body = (await request.json()) as Body;
  } catch {
    body = {};
  }
  const userId = body.userId?.trim();
  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const u = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!u) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  await prisma.launchEvent.create({
    data: {
      event: "lecipm_launch:founder_user_note",
      userId,
      payload: {
        note: body.note?.slice(0, 4000) ?? null,
        actorUserId: auth.userId,
        at: new Date().toISOString(),
      },
    },
  });

  await logGrowthEngineAudit({
    actorUserId: auth.userId,
    action: "launch_founder_user_note",
    payload: { targetUserId: userId },
  });

  return NextResponse.json({ ok: true });
}
