import { NextResponse } from "next/server";
import {
  ListingAcquisitionSourceType,
  ListingAcquisitionPermissionStatus,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { normalizeListingDescription } from "@/lib/listings/normalize-listing-description";
import { createGrowthLeadFromListingAcquisition } from "@/lib/growth/lead-service";

export const dynamic = "force-dynamic";

const PERMISSION_SNIPPET =
  "I confirm that I own this listing or have permission to publish it and its images.";

function parseSourceType(raw: string): ListingAcquisitionSourceType | null {
  const u = raw.trim().toUpperCase();
  if (u === "OWNER") return ListingAcquisitionSourceType.OWNER;
  if (u === "BROKER") return ListingAcquisitionSourceType.BROKER;
  if (u === "HOST") return ListingAcquisitionSourceType.HOST;
  return null;
}

/** POST /api/listing-acquisition/intake — public, permission-based supply intake (no scraping). */
export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? "anon";
  const limit = checkRateLimit(`listing-acq:intake:${ip}`, { windowMs: 60_000, max: 10 });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Try again shortly." },
      { status: 429, headers: getRateLimitHeaders(limit) }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const sourceType = typeof body.sourceType === "string" ? parseSourceType(body.sourceType) : null;
  const contactName = typeof body.contactName === "string" ? body.contactName.trim() : "";
  const contactEmail = typeof body.contactEmail === "string" ? body.contactEmail.trim().toLowerCase() : "";
  const contactPhone = typeof body.contactPhone === "string" ? body.contactPhone.trim() : undefined;
  const city = typeof body.city === "string" ? body.city.trim() : "";
  const propertyCategory = typeof body.propertyCategory === "string" ? body.propertyCategory.trim() : "";
  const descriptionRaw = typeof body.description === "string" ? body.description : "";
  const amenitiesText = typeof body.amenitiesText === "string" ? body.amenitiesText.trim() : undefined;
  const sourcePlatformText =
    typeof body.sourcePlatformText === "string" ? body.sourcePlatformText.trim().slice(0, 2000) : undefined;
  const permissionConfirm = body.permissionConfirm === true;
  const priceRaw = body.priceCents;
  const priceCents =
    typeof priceRaw === "number" && Number.isFinite(priceRaw) && priceRaw > 0
      ? Math.round(priceRaw)
      : typeof priceRaw === "string" && /^\d+$/.test(priceRaw)
        ? parseInt(priceRaw, 10)
        : undefined;
  const bedrooms = typeof body.bedrooms === "number" ? Math.round(body.bedrooms) : undefined;
  const bathrooms = typeof body.bathrooms === "number" ? body.bathrooms : undefined;

  let imageUrls: string[] = [];
  if (Array.isArray(body.imageUrls)) {
    imageUrls = body.imageUrls.filter((u): u is string => typeof u === "string" && u.startsWith("http")).slice(0, 24);
  }

  if (!sourceType) {
    return NextResponse.json({ error: "sourceType must be owner, broker, or host" }, { status: 400 });
  }
  if (!contactName || !contactEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
    return NextResponse.json({ error: "Valid name and email required" }, { status: 400 });
  }
  if (!city || !propertyCategory) {
    return NextResponse.json({ error: "City and property type required" }, { status: 400 });
  }
  if (!permissionConfirm) {
    return NextResponse.json(
      { error: `You must confirm: ${PERMISSION_SNIPPET}` },
      { status: 400 }
    );
  }

  const { text: description } = normalizeListingDescription(descriptionRaw);
  if (!description || description.length < 20) {
    return NextResponse.json(
      { error: "Please add a short original description (at least 20 characters)." },
      { status: 400 }
    );
  }

  const row = await prisma.listingAcquisitionLead.create({
    data: {
      sourceType,
      contactName,
      contactEmail,
      contactPhone: contactPhone || null,
      city,
      propertyCategory,
      sourcePlatformText: sourcePlatformText || null,
      permissionStatus: ListingAcquisitionPermissionStatus.GRANTED,
      description,
      amenitiesText: amenitiesText || null,
      priceCents: priceCents ?? null,
      bedrooms: bedrooms ?? null,
      bathrooms: bathrooms ?? null,
      permissionConfirmedAt: new Date(),
      submittedImageUrls: imageUrls,
    },
  });

  await createGrowthLeadFromListingAcquisition({
    listingAcquisitionLeadId: row.id,
    sourceType,
    contactName,
    contactEmail,
    contactPhone: contactPhone || null,
    city,
    propertyCategory,
  });

  return NextResponse.json(
    { ok: true, id: row.id },
    { status: 201, headers: getRateLimitHeaders(limit) }
  );
}
