import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { requestMoreDocuments } from "@/lib/verification/ownership";

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
    const reason = (body.reason as string)?.trim() || "Please submit additional documents.";

    const result = await requestMoreDocuments(listingId, adminId, reason);
    if (!result.ok) {
      return Response.json({ error: result.error }, { status: 400 });
    }
    return Response.json({ success: true, listingVerificationStatus: result.listingVerificationStatus });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Request failed" }, { status: 500 });
  }
}
