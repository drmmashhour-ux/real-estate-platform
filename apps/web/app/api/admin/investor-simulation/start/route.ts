import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

function shufflePick<T>(items: T[], n: number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy.slice(0, n);
}

/** POST — start practice session; returns sessionId + question list (no answers). */
export async function POST(req: NextRequest) {
  const uid = await getGuestId();
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await isPlatformAdmin(uid))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let count = 5;
  try {
    const body = (await req.json().catch(() => ({}))) as { count?: number };
    if (typeof body.count === "number" && Number.isFinite(body.count)) {
      count = Math.min(12, Math.max(3, Math.floor(body.count)));
    }
  } catch {
    /* default */
  }

  const pool = await prisma.investorQA.findMany({
    select: {
      id: true,
      question: true,
      category: true,
      difficulty: true,
    },
  });

  if (pool.length === 0) {
    return NextResponse.json({ error: "No investor questions in database — seed investor_qa first." }, { status: 400 });
  }

  const picked = shufflePick(pool, Math.min(count, pool.length));
  const session = await prisma.investorSession.create({
    data: {},
  });

  return NextResponse.json({
    sessionId: session.id,
    questions: picked.map((q) => ({
      id: q.id,
      question: q.question,
      category: q.category,
      difficulty: q.difficulty,
    })),
  });
}
