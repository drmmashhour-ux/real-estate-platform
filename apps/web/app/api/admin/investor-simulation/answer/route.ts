import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { prisma } from "@repo/db";
import { evaluateInvestorAnswer } from "@/lib/investor/evaluate-answer";

export const dynamic = "force-dynamic";

/** POST — submit one answer; persists row + returns AI evaluation. */
export async function POST(req: NextRequest) {
  const uid = await getGuestId();
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await isPlatformAdmin(uid))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: { sessionId?: string; questionId?: string; userAnswer?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const sessionId = typeof body.sessionId === "string" ? body.sessionId : "";
  const questionId = typeof body.questionId === "string" ? body.questionId : "";
  const userAnswer = typeof body.userAnswer === "string" ? body.userAnswer : "";
  if (!sessionId || !questionId) {
    return NextResponse.json({ error: "sessionId and questionId required" }, { status: 400 });
  }

  const session = await prisma.investorSession.findUnique({ where: { id: sessionId } });
  if (!session || session.endedAt) {
    return NextResponse.json({ error: "Invalid or ended session" }, { status: 400 });
  }

  const q = await prisma.investorQA.findUnique({ where: { id: questionId } });
  if (!q) return NextResponse.json({ error: "Question not found" }, { status: 404 });

  const evalResult = await evaluateInvestorAnswer({
    question: q.question,
    referenceAnswer: q.answer,
    userAnswer,
    category: q.category,
  });

  const row = await prisma.investorSessionAnswer.create({
    data: {
      sessionId,
      questionId,
      userAnswer: userAnswer.trim() || null,
      aiFeedback: evalResult.feedback,
      score: evalResult.score,
    },
  });

  return NextResponse.json({
    answerId: row.id,
    score: evalResult.score,
    feedback: evalResult.feedback,
    improvedAnswer: evalResult.improvedAnswer,
    dimensions: {
      clarity: evalResult.clarity,
      credibility: evalResult.credibility,
      completeness: evalResult.completeness,
      confidence: evalResult.confidence,
    },
  });
}
