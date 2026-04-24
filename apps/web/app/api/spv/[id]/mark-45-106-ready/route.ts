import { NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { markForm45106Status } from "@/modules/amf-private-placement/amf-private-placement.service";

export const dynamic = "force-dynamic";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user || (user.role !== PlatformRole.BROKER && user.role !== PlatformRole.ADMIN)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: spvId } = await context.params;

  try {
    const row = await markForm45106Status({ spvId, status: "READY", actorUserId: userId, actorRole: user.role });
    return NextResponse.json({ ok: true, exemptDistributionId: row.id, form45106F1Status: row.form45106F1Status });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    const status =
      msg === "SPV_NOT_FOUND" || msg === "EXEMPT_DISTRIBUTION_NOT_FOUND" ? 404
      : msg === "BROKER_DEAL_ACCESS_REQUIRED" ? 403
      : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}
