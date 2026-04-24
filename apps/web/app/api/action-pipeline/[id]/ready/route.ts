import { NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import {
  getActionPipelineForBroker,
  markActionPipelineReadyForSignature,
} from "@/modules/action-pipeline/action-pipeline.service";

export const dynamic = "force-dynamic";

/** POST — AI / broker: move DRAFT → READY_FOR_SIGNATURE (still not executable until signed). */
export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (user.role !== PlatformRole.BROKER && user.role !== PlatformRole.ADMIN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  const visible = await getActionPipelineForBroker(id, userId, user.role === PlatformRole.ADMIN);
  if (!visible) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    await markActionPipelineReadyForSignature({ actionId: id, actorUserId: userId });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Update failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
