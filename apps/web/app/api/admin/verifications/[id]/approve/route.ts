import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { setVerificationDecision } from "@/lib/verification/ownership";

/**
 * POST /api/admin/verifications/:id/approve — Approve listing verification (id = listingId).
 * In production, restrict to admin role.
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const adminId = await getGuestId();
    if (!adminId) {
      return Response.json({ error: "Sign in required" }, { status: 401 });
    }
    const { id: listingId } = await context.params;
    const body = await request.json().catch(() => ({}));
    const notes = (body.notes as string) || null;

    const result = await setVerificationDecision(listingId, "VERIFIED", adminId, notes);
    if (!result.ok) {
      return Response.json({ error: result.error }, { status: 400 });
    }
    return Response.json({ success: true, listingVerificationStatus: result.listingVerificationStatus });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Approve failed" }, { status: 500 });
  }
}
