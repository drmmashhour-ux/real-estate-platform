import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { prisma } from "@repo/db";
import { summarizeInvestorSessionWithAi } from "@/lib/investor/session-summary";

export const dynamic = "force-dynamic";

/** POST — finalize session: aggregate score + strengths / weaknesses. */
export async function POST(req: NextRequest) {
  const uid = await getGuestId();
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await isPlatformAdmin(uid))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let sessionId = "";
  try {
    const body = (await req.json()) as { sessionId?: string };
    sessionId = typeof body.sessionId === "string" ? body.sessionId : "";
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!sessionId) return NextResponse.json({ error: "sessionId required" }, { status: 400 });

  const session = await prisma.investorSession.findUnique({
    where: { id: sessionId },
    include: {
      answers: {
        include: {
          question: { select: { question: true } },
        },
      },
    },
  });

  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });
  if (session.endedAt) {
    return NextResponse.json({
      sessionId: session.id,
      score: session.score,
      feedback: session.feedback,
      alreadyCompleted: true,
    });
  }

  const summary = await summarizeInvestorSessionWithAi(
    session.answers.map((a) => ({
      question: a.question.question,
      userAnswer: a.userAnswer,
      score: a.score,
      aiFeedback: a.aiFeedback,
    })),
  );

  const feedbackBlock = [
    `Average score: ${summary.averageScore}`,
    "",
    `Strengths: ${summary.strengths}`,
    "",
    `Weaknesses: ${summary.weaknesses}`,
    "",
    `Recommended improvements: ${summary.recommendedImprovements}`,
  ].join("\n");

  const updated = await prisma.investorSession.update({
    where: { id: sessionId },
    data: {
      endedAt: new Date(),
      score: summary.averageScore,
      feedback: feedbackBlock,
    },
  });

  return NextResponse.json({
    sessionId: updated.id,
    averageScore: summary.averageScore,
    strengths: summary.strengths,
    weaknesses: summary.weaknesses,
    recommendedImprovements: summary.recommendedImprovements,
    feedback: feedbackBlock,
  });
}
