import { NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();

export const dynamic = "force-dynamic";

/** GET — tenant: my applications; landlord: applications for my listings. */
export async function GET(request: NextRequest) {
  const userId = await getGuestId();
  if (!userId) {
    return Response.json({ error: "Sign in required" }, { status: 401 });
  }
  const role = new URL(request.url).searchParams.get("role") ?? "tenant";
  try {
    if (role === "landlord") {
      const apps = await prisma.rentalApplication.findMany({
        where: { listing: { landlordId: userId } },
        orderBy: { createdAt: "desc" },
        include: {
          listing: { select: { id: true, title: true, listingCode: true, address: true, city: true } },
          tenant: { select: { id: true, name: true, email: true } },
        },
      });
      return Response.json({ applications: apps });
    }
    const apps = await prisma.rentalApplication.findMany({
      where: { tenantId: userId },
      orderBy: { createdAt: "desc" },
      include: {
        listing: { select: { id: true, title: true, listingCode: true, address: true, city: true, status: true } },
      },
    });
    return Response.json({ applications: apps });
  } catch (e) {
    console.error("GET /api/rental/applications:", e);
    return Response.json({ error: "Failed to load applications" }, { status: 500 });
  }
}

/** POST — submit application (tenant). */
export async function POST(request: NextRequest) {
  const tenantId = await getGuestId();
  if (!tenantId) {
    return Response.json({ error: "Sign in required" }, { status: 401 });
  }
  try {
    const body = (await request.json()) as {
      listingId?: string;
      message?: string;
      legalAcceptedAt?: string;
      documentsJson?: Record<string, unknown> | null;
    };
    const listingId = typeof body.listingId === "string" ? body.listingId.trim() : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";
    if (!listingId) {
      return Response.json({ error: "listingId is required" }, { status: 400 });
    }
    if (message.length < 20) {
      return Response.json({ error: "Please add a message (at least 20 characters)" }, { status: 400 });
    }
    if (!body.legalAcceptedAt) {
      return Response.json({ error: "Legal acceptance is required before submitting" }, { status: 400 });
    }
    const legalAcceptedAt = new Date(body.legalAcceptedAt);
    if (Number.isNaN(legalAcceptedAt.getTime())) {
      return Response.json({ error: "Invalid legalAcceptedAt" }, { status: 400 });
    }

    const listing = await prisma.rentalListing.findUnique({ where: { id: listingId } });
    if (!listing || listing.status !== "ACTIVE") {
      return Response.json({ error: "Listing is not open for applications" }, { status: 400 });
    }
    if (listing.landlordId === tenantId) {
      return Response.json({ error: "You cannot apply to your own listing" }, { status: 400 });
    }

    const existing = await prisma.rentalApplication.findFirst({
      where: { listingId, tenantId, status: "PENDING" },
    });
    if (existing) {
      return Response.json({ error: "You already have a pending application for this listing" }, { status: 409 });
    }

    const documentsJson: Prisma.InputJsonValue | undefined =
      body.documentsJson != null ? (body.documentsJson as Prisma.InputJsonValue) : undefined;

    const app = await prisma.rentalApplication.create({
      data: {
        listingId,
        tenantId,
        message,
        legalAcceptedAt,
        documentsJson,
        status: "PENDING",
      },
    });
    return Response.json({ application: app }, { status: 201 });
  } catch (e) {
    console.error("POST /api/rental/applications:", e);
    return Response.json({ error: "Failed to submit application" }, { status: 500 });
  }
}
