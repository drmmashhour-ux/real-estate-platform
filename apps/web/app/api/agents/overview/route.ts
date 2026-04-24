import { requireAdmin } from "@/modules/security/access-guard.service";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    // @ts-ignore
    const agents = await prisma.aiAgent.findMany({
      include: {
        _count: { select: { strategies: true } },
      },
      orderBy: { performanceScore: "desc" },
    });

    return NextResponse.json({ agents });
  } catch (error) {
    console.error("[agents:api] overview failed", error);
    return NextResponse.json({ error: "Failed to fetch agents overview" }, { status: 500 });
  }
}
