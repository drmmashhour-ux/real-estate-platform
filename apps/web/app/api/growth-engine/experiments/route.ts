import { requireAdmin } from "@/modules/security/access-guard.service";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    // @ts-ignore
    const experiments = await prisma.growthExperiment.findMany({
      include: { outcomes: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ experiments });
  } catch (error) {
    console.error("[growth-engine:api] experiments failed", error);
    return NextResponse.json({ error: "Failed to fetch experiments" }, { status: 500 });
  }
}
