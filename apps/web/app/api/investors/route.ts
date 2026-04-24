import { requireAdmin } from "@/modules/security/access-guard.service";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { logInfo } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * GET /api/investors — list investors with interactions
 */
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    // @ts-ignore
    const investors = await prisma.investor.findMany({
      include: {
        interactions: {
          orderBy: { date: "desc" },
          take: 5,
        },
        documents: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ investors });
  } catch (error) {
    console.error("[investor:api] list failed", error);
    return NextResponse.json({ error: "Failed to fetch investors" }, { status: 500 });
  }
}

/**
 * POST /api/investors — create new investor
 */
export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();
    const { name, email, stage, notes, targetAmount } = body;

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }

    // @ts-ignore
    const investor = await prisma.investor.create({
      data: {
        name,
        email,
        stage: stage || "NEW",
        notes,
        targetAmount: targetAmount || 0,
      },
    });

    logInfo("[investor] entity_created", { investorId: investor.id, email: investor.email });

    return NextResponse.json({ ok: true, investor });
  } catch (error) {
    console.error("[investor:api] create failed", error);
    return NextResponse.json({ error: "Failed to create investor" }, { status: 500 });
  }
}
