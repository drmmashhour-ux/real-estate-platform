import { NextResponse } from "next/server";
import { z } from "zod";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { prisma } from "@repo/db";
import { recordRecommendationOutcome } from "@/lib/ai/evals/outcome-evaluator";

export const dynamic = "force-dynamic";

const PostZ = z.object({
  recommendationId: z.string().min(1),
  outcome: z.enum(["accepted", "dismissed", "expired"]),
  score: z.number().min(0).max(1).optional(),
  payload: z.record(z.string(), z.unknown()).optional(),
});

export async function GET(req: Request) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = await isPlatformAdmin(userId);
  const { searchParams } = new URL(req.url);
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "40", 10) || 40));

  const where = admin ? {} : { userId };
  const rows = await prisma.managerAiOutcomeEval.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return NextResponse.json({ evals: rows });
}

export async function POST(req: Request) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await req.json().catch(() => null);
  const p = PostZ.safeParse(json);
  if (!p.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const rec = await prisma.managerAiRecommendation.findFirst({
    where: { id: p.data.recommendationId },
  });
  if (!rec) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  const admin = await isPlatformAdmin(userId);
  if (!admin && rec.userId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const row = await recordRecommendationOutcome({
    userId: rec.userId,
    recommendationId: p.data.recommendationId,
    outcome: p.data.outcome,
    score: p.data.score,
    payload: p.data.payload,
  });
  return NextResponse.json({ ok: true, id: row.id });
}
