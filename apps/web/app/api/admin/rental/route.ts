import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [listings, applications, leases, payments] = await Promise.all([
    prisma.rentalListing.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { landlord: { select: { email: true, name: true } } },
    }),
    prisma.rentalApplication.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        listing: { select: { title: true, listingCode: true } },
        tenant: { select: { email: true, name: true } },
      },
    }),
    prisma.rentalLease.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        listing: { select: { title: true } },
        tenant: { select: { email: true } },
        landlord: { select: { email: true } },
      },
    }),
    prisma.rentPayment.findMany({
      orderBy: { dueDate: "desc" },
      take: 200,
      include: {
        lease: { select: { id: true, listing: { select: { title: true } } } },
      },
    }),
  ]);

  return NextResponse.json({ listings, applications, leases, payments });
}
