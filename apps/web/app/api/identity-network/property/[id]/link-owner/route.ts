import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { linkPropertyOwner } from "@/lib/identity-network";

/**
 * POST /api/identity-network/property/:id/link-owner
 * Body: { ownerIdentityId, source }
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await getGuestId();
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const { ownerIdentityId, source } = body;
    if (!ownerIdentityId || typeof ownerIdentityId !== "string") {
      return Response.json({ error: "ownerIdentityId required" }, { status: 400 });
    }
    if (!source || typeof source !== "string") {
      return Response.json({ error: "source required" }, { status: 400 });
    }
    const record = await linkPropertyOwner(id, ownerIdentityId, source);
    return Response.json(record);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to link owner";
    return Response.json({ error: message }, { status: 400 });
  }
}
