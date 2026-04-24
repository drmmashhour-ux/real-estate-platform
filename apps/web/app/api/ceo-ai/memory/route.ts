import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthSession } from "@/lib/auth"; // Assuming this is the auth helper
import { PlatformRole } from "@prisma/client";

export async function GET() {
  const session = await getAuthSession();
  if (!session || session.user.role !== PlatformRole.ADMIN) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const memory = await prisma.ceoDecisionMemory.findMany({
    include: { outcomes: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ ok: true, memory });
}
