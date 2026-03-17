import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { recordEvent } from "@/lib/property-identity/events";

/**
 * POST /api/admin/property-identities/:id/request-review
 * Body: message? – Request additional documents or manual review. Creates event and can trigger notification.
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
    const message = (body.message as string) || "Admin requested review or additional documents.";

    const identity = await prisma.propertyIdentity.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!identity) {
      return Response.json({ error: "Property identity not found" }, { status: 404 });
    }

    await recordEvent(id, "manual_review_requested", { message, requested_by: userId }, userId);

    return Response.json({ success: true, message });
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Request review failed" },
      { status: 500 }
    );
  }
}
