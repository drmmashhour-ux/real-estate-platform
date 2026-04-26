import { NextResponse } from "next/server";
import { verifyCeoAccess } from "@/modules/ceo-ai/ceo-auth.helper";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();

export async function GET() {
  const auth = await verifyCeoAccess();
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const memory = await prisma.ceoDecisionMemory.findMany({ 
    include: { outcomes: true },
    orderBy: { createdAt: "desc" },
    take: 50
  });
  return NextResponse.json({ ok: true, memory });
}
