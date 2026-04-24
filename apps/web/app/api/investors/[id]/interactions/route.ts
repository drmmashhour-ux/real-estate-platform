import { requireAdmin } from "@/modules/security/access-guard.service";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { logInfo } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * POST /api/investors/[id]/interactions — log a new interaction
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    const body = await req.json();
    const { type, notes, date } = body;

    if (!type) {
      return NextResponse.json({ error: "Interaction type is required" }, { status: 400 });
    }

    // @ts-ignore
    const interaction = await prisma.investorInteraction.create({
      data: {
        investorId: id,
        type,
        notes,
        date: date ? new Date(date) : new Date(),
      },
    });

    logInfo("[investor] interaction_logged", { investorId: id, type });

    return NextResponse.json({ ok: true, interaction });
  } catch (error) {
    console.error("[investor:api] interaction log failed", error);
    return NextResponse.json({ error: "Failed to log interaction" }, { status: 500 });
  }
}
