import { NextRequest } from "next/server";
import { prisma } from "@repo/db";
import { getGuestId } from "@/lib/auth/session";
import { evaluateUserHeuristic } from "@/lib/ai/fraud-heuristics";

export const dynamic = "force-dynamic";

/** POST /api/admin/ai/fraud-heuristic — admin only; runs explainable heuristics. */
export async function POST(request: NextRequest) {
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const admin = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (admin?.role !== "ADMIN") return Response.json({ error: "Admin only" }, { status: 403 });

  let body: { targetUserId?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const targetUserId = typeof body.targetUserId === "string" ? body.targetUserId : "";
  if (!targetUserId) return Response.json({ error: "targetUserId required" }, { status: 400 });

  const result = await evaluateUserHeuristic(targetUserId);

  await prisma.fraudScore
    .create({
      data: {
        entityType: "USER",
        entityId: targetUserId,
        score: result.riskScore / 100,
        factors: { flags: result.flags, engine: "heuristic_v1" },
        priority: result.riskScore >= 70 ? "HIGH" : result.riskScore >= 40 ? "MEDIUM" : "LOW",
      },
    })
    .catch(() => {});

  return Response.json({
    ...result,
    disclaimer: "Heuristic signals only — escalate to Trust & Safety for decisions.",
  });
}
