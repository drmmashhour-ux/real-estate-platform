import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import { PlatformRole } from "@prisma/client";
import { createLongTermGoal } from "@/modules/ceo-ai/ceo-long-term-goals.service";

export async function GET() {
  const session = await getAuthSession();
  if (!session || session.user.role !== PlatformRole.ADMIN) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const goals = await prisma.ceoLongTermGoal.findMany({
    orderBy: { priority: "desc" },
  });

  return NextResponse.json({ ok: true, goals });
}

export async function POST(req: Request) {
  const session = await getAuthSession();
  if (!session || session.user.role !== PlatformRole.ADMIN) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const goal = await createLongTermGoal(body);
    return NextResponse.json({ ok: true, goal });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 400 });
  }
}
