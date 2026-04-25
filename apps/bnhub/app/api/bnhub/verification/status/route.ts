import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import {
  getOwnerVerificationStatus,
  getPropertyVerificationStatus,
} from "@/lib/bnhub/mandatory-verification";
import { prisma } from "@repo/db";

/**
 * GET /api/bnhub/verification/status?userId=... | ?listingId=...
 * Returns owner verification and, if listingId given, property verification.
 * userId defaults to session user.
 */
export async function GET(request: NextRequest) {
  try {
    const sessionUserId = await getGuestId();
    const { searchParams } = new URL(request.url);
    const userIdParam = searchParams.get("userId");
    const listingIdParam = searchParams.get("listingId");

    const userId = userIdParam ?? sessionUserId ?? null;
    if (!userId) {
      return Response.json(
        { error: "Sign in required or provide userId" },
        { status: 401 }
      );
    }
    if (userIdParam && userIdParam !== sessionUserId) {
      const listing = listingIdParam
        ? await prisma.shortTermListing.findUnique({
            where: { id: listingIdParam },
            select: { ownerId: true },
          })
        : null;
      const isOwner = listing?.ownerId === sessionUserId;
      if (!isOwner && userId !== sessionUserId) {
        return Response.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const ownerStatus = await getOwnerVerificationStatus(userId);
    let propertyStatus: Awaited<ReturnType<typeof getPropertyVerificationStatus>> | null = null;
    if (listingIdParam) {
      const listing = await prisma.shortTermListing.findUnique({
        where: { id: listingIdParam },
        select: { ownerId: true },
      });
      if (listing && (listing.ownerId === sessionUserId || listing.ownerId === userId)) {
        propertyStatus = await getPropertyVerificationStatus(listingIdParam);
      }
    }

    return Response.json({
      owner: ownerStatus,
      property: propertyStatus,
    });
  } catch (e) {
    console.error("GET /api/bnhub/verification/status:", e);
    return Response.json(
      { error: "Failed to load verification status" },
      { status: 500 }
    );
  }
}
