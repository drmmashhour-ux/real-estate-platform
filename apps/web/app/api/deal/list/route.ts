import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireMonitoringContext } from "@/lib/monitoring/api-context";

export async function GET() {
  const ctx = await requireMonitoringContext();
  if (!ctx.ok) return ctx.response;

  const items = await prisma.dealCandidate.findMany({
    orderBy: { dealScore: "desc" },
    take: 100,
  });

  return NextResponse.json({ success: true, items });
}
