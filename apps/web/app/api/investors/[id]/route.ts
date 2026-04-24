import { requireAdmin } from "@/modules/security/access-guard.service";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { logInfo } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/investors/[id] — update investor details
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    const body = await req.json();
    const { stage, notes, actualAmount, targetAmount } = body;

    // @ts-ignore
    const updated = await prisma.investor.update({
      where: { id },
      data: {
        stage,
        notes,
        actualAmount,
        targetAmount,
      },
    });

    logInfo("[investor] entity_updated", { investorId: id, stage });

    return NextResponse.json({ ok: true, investor: updated });
  } catch (error) {
    console.error("[investor:api] update failed", error);
    return NextResponse.json({ error: "Failed to update investor" }, { status: 500 });
  }
}
