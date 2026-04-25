import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";

/**
 * POST /api/bnhub/owner-verification/confirm-ownership
 * Host confirms they own or have the right to list the property.
 * Sets ownershipConfirmationStatus = confirmed (pending → confirmed).
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getGuestId();
    if (!userId) {
      return Response.json(
        { error: "Sign in required" },
        { status: 401 }
      );
    }

    const host = await prisma.bnhubHost.findUnique({
      where: { userId },
    });
    if (!host) {
      return Response.json(
        { error: "Apply to become a host first" },
        { status: 400 }
      );
    }
    if (host.ownershipConfirmationStatus === "rejected") {
      return Response.json(
        { error: "Ownership confirmation was rejected. Contact support." },
        { status: 400 }
      );
    }

    await prisma.bnhubHost.update({
      where: { id: host.id },
      data: {
        ownershipConfirmationStatus: "confirmed",
        ownershipConfirmedAt: new Date(),
      },
    });

    return Response.json({
      ok: true,
      ownershipConfirmationStatus: "confirmed",
    });
  } catch (e) {
    console.error("POST /api/bnhub/owner-verification/confirm-ownership:", e);
    return Response.json(
      { error: "Failed to confirm ownership" },
      { status: 500 }
    );
  }
}
