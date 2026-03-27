import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { grantListingAccess, revokeListingAccess } from "@/lib/broker/collaboration";

export const dynamic = "force-dynamic";

/** POST: grant a broker access to the listing. Body: { brokerId, role }. */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const grantedById = await getGuestId();
  if (!grantedById) {
    return Response.json({ error: "Sign in required" }, { status: 401 });
  }
  const { id: listingId } = await params;
  const body = await req.json().catch(() => ({}));
  const brokerId = body.brokerId;
  const role = body.role ?? "viewer";
  if (!brokerId || typeof brokerId !== "string") {
    return Response.json({ error: "brokerId required" }, { status: 400 });
  }
  if (!["viewer", "collaborator", "owner"].includes(role)) {
    return Response.json({ error: "Invalid role" }, { status: 400 });
  }
  const ok = await grantListingAccess({
    listingId,
    brokerId,
    role: role as "viewer" | "collaborator" | "owner",
    grantedById,
  });
  if (!ok) {
    return Response.json({ error: "Forbidden or listing not found" }, { status: 403 });
  }
  return Response.json({ success: true });
}

/** DELETE: revoke a broker's access. brokerId in query. */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const revokedById = await getGuestId();
  if (!revokedById) {
    return Response.json({ error: "Sign in required" }, { status: 401 });
  }
  const { id: listingId } = await params;
  const { searchParams } = new URL(req.url);
  const brokerId = searchParams.get("brokerId");
  if (!brokerId) {
    return Response.json({ error: "brokerId required" }, { status: 400 });
  }
  const ok = await revokeListingAccess(listingId, brokerId, revokedById);
  if (!ok) {
    return Response.json({ error: "Forbidden or listing not found" }, { status: 403 });
  }
  return Response.json({ success: true });
}
