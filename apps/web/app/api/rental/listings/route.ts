import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { generateRentalListingCode } from "@/lib/codes/generate-code";

export const dynamic = "force-dynamic";

/** GET — public search (active), or `?mine=1` for landlord's listings (all statuses). */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") ?? "").trim().toLowerCase();
    const mine = searchParams.get("mine") === "1";
    const landlordId = mine ? await getGuestId() : null;
    if (mine && !landlordId) {
      return Response.json({ error: "Sign in required" }, { status: 401 });
    }

    const textFilter = q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" as const } },
            { address: { contains: q, mode: "insensitive" as const } },
            { city: { contains: q, mode: "insensitive" as const } },
            { listingCode: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {};

    const rows = await prisma.rentalListing.findMany({
      where: {
        ...(mine && landlordId
          ? { landlordId }
          : { status: { in: ["ACTIVE", "RENTED"] } }),
        ...textFilter,
      },
      orderBy: { createdAt: "desc" },
      take: mine ? 100 : 50,
      select: {
        id: true,
        listingCode: true,
        title: true,
        description: true,
        priceMonthly: true,
        depositAmount: true,
        address: true,
        city: true,
        status: true,
        createdAt: true,
      },
    });
    return Response.json({ listings: rows });
  } catch (e) {
    console.error("GET /api/rental/listings:", e);
    return Response.json({ error: "Failed to load listings" }, { status: 500 });
  }
}

/** POST — landlord creates a listing (draft or active). */
export async function POST(request: NextRequest) {
  const landlordId = await getGuestId();
  if (!landlordId) {
    return Response.json({ error: "Sign in required" }, { status: 401 });
  }
  try {
    const body = (await request.json()) as {
      title?: string;
      description?: string;
      priceMonthly?: number;
      depositAmount?: number;
      address?: string;
      city?: string;
      status?: "DRAFT" | "ACTIVE";
    };
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const description = typeof body.description === "string" ? body.description.trim() : "";
    const address = typeof body.address === "string" ? body.address.trim() : "";
    if (!title || !description || !address) {
      return Response.json({ error: "title, description, and address are required" }, { status: 400 });
    }
    const priceMonthly = Number(body.priceMonthly);
    const depositAmount = Number(body.depositAmount);
    if (!Number.isFinite(priceMonthly) || priceMonthly <= 0) {
      return Response.json({ error: "priceMonthly must be a positive number (cents)" }, { status: 400 });
    }
    if (!Number.isFinite(depositAmount) || depositAmount < 0) {
      return Response.json({ error: "depositAmount must be zero or positive (cents)" }, { status: 400 });
    }
    const status = body.status === "DRAFT" ? "DRAFT" : "ACTIVE";
    const city = typeof body.city === "string" ? body.city.trim() || null : null;

    const listing = await prisma.$transaction(async (tx) => {
      const listingCode = await generateRentalListingCode(tx);
      return tx.rentalListing.create({
        data: {
          listingCode,
          landlordId,
          title,
          description,
          priceMonthly: Math.round(priceMonthly),
          depositAmount: Math.round(depositAmount),
          address,
          city,
          status,
        },
      });
    });

    return Response.json(listing, { status: 201 });
  } catch (e) {
    console.error("POST /api/rental/listings:", e);
    return Response.json({ error: "Failed to create listing" }, { status: 500 });
  }
}
