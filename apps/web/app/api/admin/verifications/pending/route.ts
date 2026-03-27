import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import type { ListingVerificationStatus } from "@prisma/client";

/**
 * GET /api/admin/verifications/pending — List listings pending ownership verification.
 * Admin-only (caller should enforce admin role in middleware or wrapper).
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = (searchParams.get("status") as ListingVerificationStatus | null) || "PENDING_VERIFICATION";
    const limit = Math.min(Number(searchParams.get("limit")) || 50, 100);

    const listings = await prisma.shortTermListing.findMany({
      where: { listingVerificationStatus: status },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        propertyDocuments: true,
        propertyVerification: true,
      },
      orderBy: { submittedForVerificationAt: "asc" },
      take: limit,
    });

    return Response.json({
      listings: listings.map((l) => ({
        id: l.id,
        title: l.title,
        address: l.address,
        city: l.city,
        municipality: l.municipality,
        province: l.province,
        cadastreNumber: l.cadastreNumber,
        listingAuthorityType: l.listingAuthorityType,
        brokerLicenseNumber: l.brokerLicenseNumber,
        brokerageName: l.brokerageName,
        listingVerificationStatus: l.listingVerificationStatus,
        submittedForVerificationAt: l.submittedForVerificationAt,
        owner: l.owner,
        documents: l.propertyDocuments,
        verification: l.propertyVerification,
      })),
    });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to fetch pending verifications" }, { status: 500 });
  }
}
