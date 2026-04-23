import { NextResponse } from "next/server";
import { verifyCeoAccess } from "@/modules/ceo-ai/ceo-auth.helper";
import { prisma } from "@repo/db";
import { createLongTermGoal } from "@/modules/ceo-ai/ceo-long-term-goals.service";

export async function GET() {
  const auth = await verifyCeoAccess();
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const goals = await prisma.ceoLongTermGoal.findMany({ 
    orderBy: { priority: "desc" } 
  });
  return NextResponse.json({ ok: true, goals });
}

export async function POST(req: Request) {
  const auth = await verifyCeoAccess();
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  try {
    const body = await req.json();
    const goal = await createLongTermGoal(body);
    return NextResponse.json({ ok: true, goal });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 400 });
  }
}
