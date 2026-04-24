import { requireAdmin } from "@/modules/security/access-guard.service";
import { resolveDispute } from "@/modules/disputes/workflow.engine";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/disputes/[id]/resolve — resolve a dispute (admin only)
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
    const { resolutionType, refundCents, notes } = body;

    if (!resolutionType) {
      return NextResponse.json({ error: "Resolution type is required" }, { status: 400 });
    }

    const result = await resolveDispute(id, {
      resolutionType,
      refundCents,
      notes,
      resolvedBy: auth.userId,
    });

    return NextResponse.json({ ok: true, dispute: result });
  } catch (error) {
    console.error("[dispute:api] resolve failed", error);
    return NextResponse.json({ error: "Failed to resolve dispute" }, { status: 500 });
  }
}
