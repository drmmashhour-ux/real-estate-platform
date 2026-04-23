import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";

export const dynamic = "force-dynamic";

/** GET /api/ai/recommendations — LECIPM Manager AI recommendation cards for the signed-in user. */
export async function GET(req: Request) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? "active";
  const where =
    status === "all"
      ? { userId }
      : {
          userId,
          status: status === "dismissed" ? "dismissed" : "active",
        };
  const rows = await prisma.managerAiRecommendation.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    take: 80,
  });
  return NextResponse.json({
    recommendations: rows.map((r) => ({
      id: r.id,
      agentKey: r.agentKey,
      title: r.title,
      description: r.description,
      confidence: r.confidence,
      targetEntityType: r.targetEntityType,
      targetEntityId: r.targetEntityId,
      suggestedAction: r.suggestedAction,
      status: r.status,
      payload: r.payload,
      updatedAt: r.updatedAt.toISOString(),
    })),
  });
}
