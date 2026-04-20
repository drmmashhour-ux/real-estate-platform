import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Latest saved deterministic narrative snapshot for a scope (read-only). */
export async function GET(req: NextRequest) {
  const scopeType = req.nextUrl.searchParams.get("scopeType")?.trim();
  const scopeId = req.nextUrl.searchParams.get("scopeId")?.trim();

  if (!scopeType || !scopeId) {
    return NextResponse.json({ error: "scopeType and scopeId are required" }, { status: 400 });
  }

  const row = await prisma.bnhubDashboardNarrativeSnapshot.findFirst({
    where: { scopeType, scopeId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ success: true, row });
}
