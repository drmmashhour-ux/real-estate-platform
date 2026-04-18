import { NextRequest } from "next/server";
import { searchListings, createListing } from "@/lib/bnhub/listings";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";
import { requireContentLicenseAccepted } from "@/lib/legal/content-license-enforcement";
import { bnhubV2Flags } from "@/config/feature-flags";
import { computeBnhubRankingBundle } from "@/modules/bnhub-ranking/ranking-engine.service";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get("city") ?? undefined;
    const listingCode = searchParams.get("listingCode") ?? undefined;
    const checkIn = searchParams.get("checkIn") ?? undefined;
    const checkOut = searchParams.get("checkOut") ?? undefined;
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const guests = searchParams.get("guests");
    const verifiedOnly =
      searchParams.get("verifiedOnly") === "true" || searchParams.get("verified_only") === "true";
    const propertyType = searchParams.get("propertyType") ?? undefined;
    const roomType = searchParams.get("roomType") ?? undefined;
    const instantBook = searchParams.get("instantBook") === "true";
    const sort = searchParams.get("sort") ?? "newest";

    // If any search-specific params are present, keep the guest search behavior.
    const hasSearchParams = Boolean(
      city ||
        listingCode ||
        checkIn ||
        checkOut ||
        minPrice ||
        maxPrice ||
        guests ||
        searchParams.get("verifiedOnly") != null ||
        searchParams.get("verified_only") != null ||
        propertyType ||
        roomType ||
        searchParams.get("instantBook") != null ||
        searchParams.get("sort") != null
    );

    const ownerIdFromQuery = searchParams.get("ownerId") ?? null;
    const guestId = await getGuestId();
    const effectiveOwnerId = ownerIdFromQuery ?? guestId ?? process.env.NEXT_PUBLIC_DEMO_HOST_ID ?? null;

    const listings = hasSearchParams
      ? await searchListings({
          city,
          listingCode: listingCode ?? undefined,
          checkIn,
          checkOut,
          minPrice: minPrice ? Number(minPrice) : undefined,
          maxPrice: maxPrice ? Number(maxPrice) : undefined,
          guests: guests ? Number(guests) : undefined,
          verifiedOnly,
          propertyType,
          roomType,
          instantBook: instantBook || undefined,
          sort: sort === "priceAsc" || sort === "priceDesc" || sort === "recommended" ? sort : "newest",
        })
      : await prisma.shortTermListing.findMany({
          where: effectiveOwnerId
            ? { ownerId: effectiveOwnerId }
            : { listingStatus: "PUBLISHED" },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            listingCode: true,
            title: true,
            description: true,
            city: true,
            nightPriceCents: true,
            photos: true,
            listingStatus: true,
            createdAt: true,
          },
        });

    // Normalize `photos` JSON field to string[] for the UI.
    if (!hasSearchParams) {
      const normalized = listings.map((l: any) => ({
        ...l,
        photos: Array.isArray(l.photos) ? (l.photos.filter((p: unknown): p is string => typeof p === "string") as string[]) : [],
      }));
      const includeScores = request.nextUrl.searchParams.get("includeScores") === "true";
      if (includeScores && bnhubV2Flags.bnhubV2 && bnhubV2Flags.bnhubRankingV1) {
        const enriched = await Promise.all(
          normalized.map(async (l: { id: string }) => ({
            ...l,
            bnhubV2: await computeBnhubRankingBundle(l.id),
          })),
        );
        return Response.json(enriched);
      }
      return Response.json(normalized);
    }

    const includeScores = searchParams.get("includeScores") === "true";
    if (includeScores && bnhubV2Flags.bnhubV2 && bnhubV2Flags.bnhubRankingV1) {
      const enriched = await Promise.all(
        (listings as { id: string }[]).map(async (l) => ({
          ...l,
          bnhubV2: await computeBnhubRankingBundle(l.id),
        })),
      );
      return Response.json(enriched);
    }

    return Response.json(listings);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to fetch listings" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      location,
      pricePerNight,
      imageUrls,
    }: {
      title?: string;
      description?: string;
      location?: string;
      pricePerNight?: number | string;
      imageUrls?: string[] | string;
    } = body ?? {};

    const resolvedTitle = typeof title === "string" ? title.trim() : "";
    const resolvedLocation = typeof location === "string" ? location.trim() : "";
    const resolvedPricePerNight = Number(pricePerNight);

    const guestId = await getGuestId();
    const ownerId = guestId ?? process.env.NEXT_PUBLIC_DEMO_HOST_ID ?? null;
    if (!ownerId) {
      return Response.json({ error: "Sign in required" }, { status: 401 });
    }
    if (guestId) {
      const licenseBlock = await requireContentLicenseAccepted(guestId);
      if (licenseBlock) return licenseBlock;
    }

    if (!resolvedTitle || !resolvedLocation || !Number.isFinite(resolvedPricePerNight) || resolvedPricePerNight <= 0) {
      return Response.json(
        { error: "title, location, and pricePerNight are required" },
        { status: 400 }
      );
    }

    const images =
      typeof imageUrls === "string"
        ? imageUrls
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : Array.isArray(imageUrls)
          ? imageUrls.filter((s) => typeof s === "string" && s.trim().length > 0)
          : [];

    // Minimal defaults to satisfy `ShortTermListing` required fields.
    const locLower = resolvedLocation.toLowerCase();
    const country = locLower.includes("montreal") || locLower.includes("quebec") ? "CA" : "US";
    const region = locLower.includes("montreal") ? "Quebec" : undefined;

    const listing = await createListing({
      ownerId,
      title: resolvedTitle,
      description: typeof description === "string" ? description.trim() || undefined : undefined,
      address: `${resolvedLocation} (Host address)`,
      city: resolvedLocation,
      region,
      country,
      nightPriceCents: Math.round(resolvedPricePerNight * 100),
      beds: 1,
      baths: 1,
      maxGuests: 2,
      photos: images,
      listingStatus: "PUBLISHED",
    });

    void import("@/modules/fraud/fraud-engine.service")
      .then((m) =>
        m.evaluateLaunchFraudEngine(
          { user: { id: ownerId }, listing: { id: listing.id } },
          { persist: true, actionType: "listing_created_v1" }
        )
      )
      .catch(() => {});

    return Response.json(listing, { status: 201 });
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Failed to create listing" },
      { status: 400 }
    );
  }
}
