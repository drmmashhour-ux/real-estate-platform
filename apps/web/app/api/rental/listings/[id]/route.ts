import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const viewerId = await getGuestId();
    const row = await prisma.rentalListing.findUnique({
      where: { id },
      include: {
        landlord: { select: { id: true, name: true, email: true } },
      },
    });
    if (!row) {
      return Response.json({ error: "Listing not found" }, { status: 404 });
    }
    const isOwner = viewerId != null && row.landlordId === viewerId;
    const tenantLease =
      viewerId != null && row.status === "RENTED"
        ? await prisma.rentalLease.findFirst({
            where: { listingId: row.id, tenantId: viewerId },
            select: { id: true },
          })
        : null;
    const isTenantOfRecord = Boolean(tenantLease);
    if (row.status === "DRAFT" && !isOwner) {
      return Response.json({ error: "Listing not available" }, { status: 404 });
    }
    if (row.status === "RENTED" && !isOwner && !isTenantOfRecord) {
      return Response.json({ error: "Listing not available" }, { status: 404 });
    }
    return Response.json({ listing: row });
  } catch (e) {
    console.error("GET /api/rental/listings/[id]:", e);
    return Response.json({ error: "Failed to load listing" }, { status: 500 });
  }
}
