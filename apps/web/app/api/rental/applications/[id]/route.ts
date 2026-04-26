import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { DEFAULT_RENTAL_LEASE_CONTRACT } from "@/lib/rental/default-contract";
import { createRentPaymentSchedule } from "@/lib/rental/lease-payments";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const landlordId = await getGuestId();
  if (!landlordId) {
    return Response.json({ error: "Sign in required" }, { status: 401 });
  }
  const { id } = await context.params;
  try {
    const body = (await request.json()) as { status?: "ACCEPTED" | "REJECTED" };
    const next = body.status;
    if (next !== "ACCEPTED" && next !== "REJECTED") {
      return Response.json({ error: "status must be ACCEPTED or REJECTED" }, { status: 400 });
    }

    const application = await prisma.rentalApplication.findUnique({
      where: { id },
      include: { listing: true },
    });
    if (!application) {
      return Response.json({ error: "Application not found" }, { status: 404 });
    }
    if (application.listing.landlordId !== landlordId) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
    if (application.status !== "PENDING") {
      return Response.json({ error: "Application is no longer pending" }, { status: 400 });
    }

    if (next === "REJECTED") {
      const updated = await prisma.rentalApplication.update({
        where: { id },
        data: { status: "REJECTED" },
      });
      return Response.json({ application: updated });
    }

    // ACCEPTED: create lease + update listing + reject other pendings
    const start = new Date();
    start.setUTCDate(1);
    start.setUTCHours(12, 0, 0, 0);
    const end = new Date(start);
    end.setUTCFullYear(end.getUTCFullYear() + 1);

    const result = await prisma.$transaction(async (tx) => {
      await tx.rentalApplication.updateMany({
        where: {
          listingId: application.listingId,
          id: { not: id },
          status: "PENDING",
        },
        data: { status: "REJECTED" },
      });

      const lease = await tx.rentalLease.create({
        data: {
          listingId: application.listingId,
          tenantId: application.tenantId,
          landlordId: application.listing.landlordId,
          applicationId: application.id,
          startDate: start,
          endDate: end,
          monthlyRent: application.listing.priceMonthly,
          deposit: application.listing.depositAmount,
          status: "PENDING_SIGNATURE",
          contractText: DEFAULT_RENTAL_LEASE_CONTRACT,
        },
      });

      await tx.rentalListing.update({
        where: { id: application.listingId },
        data: { status: "RENTED" },
      });

      await tx.rentalApplication.update({
        where: { id },
        data: { status: "ACCEPTED" },
      });

      return lease;
    });

    await createRentPaymentSchedule(result.id, result.monthlyRent, start, 12);

    const lease = await prisma.rentalLease.findUnique({
      where: { id: result.id },
      include: { listing: { select: { title: true } } },
    });

    return Response.json({ lease, applicationId: id });
  } catch (e) {
    console.error("PATCH /api/rental/applications/[id]:", e);
    return Response.json({ error: "Failed to update application" }, { status: 500 });
  }
}
