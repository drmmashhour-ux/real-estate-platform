import { NextResponse } from "next/server";
import { verifyCeoAccess } from "@/modules/ceo-ai/ceo-auth.helper";
import { prisma } from "@repo/db";

export async function GET() {
  const auth = await verifyCeoAccess();
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const outcomes = await prisma.ceoDecisionOutcome.findMany({ 
    include: { memory: true },
    orderBy: { createdAt: "desc" },
    take: 50
  });
  return NextResponse.json({ ok: true, outcomes });
}
