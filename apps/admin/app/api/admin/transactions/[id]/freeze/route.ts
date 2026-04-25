import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";

/**
 * POST /api/admin/transactions/:id/freeze
 * Body: freeze (boolean) - set frozen_by_admin
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getGuestId();
    if (!userId) {
      return Response.json({ error: "Sign in required" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const freeze = body.freeze !== false;

    const tx = await prisma.realEstateTransaction.update({
      where: { id },
      data: { frozenByAdmin: freeze },
    });

    return Response.json({
      transaction_id: tx.id,
      frozen_by_admin: tx.frozenByAdmin,
    });
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Freeze failed" },
      { status: 500 }
    );
  }
}
