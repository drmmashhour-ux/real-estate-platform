import { NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { getActionPipelineForBroker } from "@/modules/action-pipeline/action-pipeline.service";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
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
  const row = await getActionPipelineForBroker(id, userId, user.role === PlatformRole.ADMIN);
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    id: row.id,
    type: row.type,
    status: row.status,
    aiGenerated: row.aiGenerated,
    dataJson: row.dataJson,
    dealId: row.dealId,
    deal: row.deal,
    createdAt: row.createdAt.toISOString(),
    brokerSignature: row.brokerSignature,
  });
}
