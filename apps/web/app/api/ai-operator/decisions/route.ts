import { NextRequest } from "next/server";
import { prisma } from "@repo/db";

export const dynamic = "force-dynamic";

/** GET /api/ai-operator/decisions – List AI Operator decisions (from Prisma). */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agentType = searchParams.get("agentType") ?? undefined;
    const entityType = searchParams.get("entityType") ?? undefined;
    const entityId = searchParams.get("entityId") ?? undefined;
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 50));
    const offset = Math.max(0, Number(searchParams.get("offset")) || 0);

    const where: { agentType?: string; entityType?: string; entityId?: string } = {};
    if (agentType) where.agentType = agentType;
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;

    const decisions = await prisma.aiOperatorDecision.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });
    return Response.json({ decisions });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to list decisions" }, { status: 500 });
  }
}
