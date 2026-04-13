import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { createVerificationRequest } from "@/lib/trust/create-verification-request";

export const dynamic = "force-dynamic";

/**
 * POST /api/trust/verification-request — submit broker or listing verification (authenticated).
 */
export async function POST(request: Request) {
  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { type?: string; listingId?: string; notes?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const type = body.type === "broker" || body.type === "listing" ? body.type : null;
  if (!type) {
    return NextResponse.json({ error: "type must be broker | listing" }, { status: 400 });
  }

  try {
    const row = await createVerificationRequest({
      userId,
      type,
      listingId: body.listingId,
      notes: body.notes,
    });
    return NextResponse.json({ id: row.id, status: row.status });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
