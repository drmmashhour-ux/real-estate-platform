import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/require-role";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

/** POST — admin only */
export async function POST(_req: Request, context: RouteContext) {
  const auth = await requireRole("admin");
  if (!auth.ok) return auth.response;

  const { id } = await context.params;

  const row = await prisma.investmentRecommendation.update({
    where: { id },
    data: { status: "applied" },
  });

  await prisma.investmentRecommendationLog.create({
    data: {
      recommendationId: row.id,
      actionType: "applied",
      message: "Recommendation marked as applied.",
    },
  });

  return NextResponse.json({ success: true, row });
}
