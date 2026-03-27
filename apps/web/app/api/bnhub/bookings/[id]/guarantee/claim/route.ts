import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { claimGuarantee } from "@/lib/bnhub/bnhub-guarantee";

/** POST /api/bnhub/bookings/:id/guarantee/claim — Guest claims BNHub guarantee (mismatch / issue). */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getGuestId();
    if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });
    const { id: bookingId } = await params;
    const row = await claimGuarantee(bookingId, userId);
    return Response.json({ guarantee: row });
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Claim failed" },
      { status: 400 }
    );
  }
}
