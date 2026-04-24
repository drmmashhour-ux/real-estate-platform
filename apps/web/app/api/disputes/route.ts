import { requireUser } from "@/modules/security/access-guard.service";
import { openDispute } from "@/modules/disputes/workflow.engine";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * POST /api/disputes — open a new dispute
 */
export async function POST(req: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();
    const { bookingId, description, category, claimant } = body;

    if (!bookingId || !description || !claimant) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const dispute = await openDispute({
      bookingId,
      claimant,
      claimantUserId: auth.userId,
      description,
      category,
    });

    return NextResponse.json({ ok: true, dispute });
  } catch (error) {
    console.error("[dispute:api] create failed", error);
    return NextResponse.json({ error: "Failed to create dispute" }, { status: 500 });
  }
}

/**
 * GET /api/disputes — list disputes for current user or admin
 */
export async function GET() {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  try {
    // In a real app, check if user is admin or filter by userId
    const disputes = await prisma.dispute.findMany({
      include: {
        booking: { select: { id: true, confirmationCode: true } },
        listing: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ disputes });
  } catch (error) {
    console.error("[dispute:api] list failed", error);
    return NextResponse.json({ error: "Failed to fetch disputes" }, { status: 500 });
  }
}
