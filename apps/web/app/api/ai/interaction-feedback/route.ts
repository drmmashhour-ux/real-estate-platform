import { NextRequest, NextResponse } from "next/server";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { getGuestId } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  let body: { logId?: string; feedback?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const logId = typeof body.logId === "string" ? body.logId.trim() : "";
  const feedback = body.feedback === "helpful" || body.feedback === "not_helpful" ? body.feedback : null;
  if (!logId || !feedback) {
    return NextResponse.json({ error: "logId and feedback (helpful|not_helpful) required" }, { status: 400 });
  }

  const existing = await prisma.aiInteractionLog.findFirst({
    where: { id: logId, userId },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.aiInteractionLog.update({
    where: { id: logId },
    data: { feedback },
  });

  return NextResponse.json({ ok: true });
}
