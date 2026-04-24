import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import { PlatformRole } from "@prisma/client";

export async function GET() {
  const session = await getAuthSession();
  if (!session || session.user.role !== PlatformRole.ADMIN) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const patterns = await prisma.ceoStrategyPattern.findMany({
    orderBy: { score: "desc" },
  });

  return NextResponse.json({ ok: true, patterns });
}
