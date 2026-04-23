import { NextResponse } from "next/server";
import { verifyCeoAccess } from "@/modules/ceo-ai/ceo-auth.helper";
import { prisma } from "@repo/db";

export async function GET() {
  const auth = await verifyCeoAccess();
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const patterns = await prisma.ceoStrategyPattern.findMany({ 
    orderBy: { score: "desc" }
  });
  return NextResponse.json({ ok: true, patterns });
}
