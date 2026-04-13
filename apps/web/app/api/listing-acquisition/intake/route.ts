import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  ListingAcquisitionSourceType,
  ListingAcquisitionPermissionStatus,
  type FsboListingOwnerType,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { normalizeListingDescription } from "@/lib/listings/normalize-listing-description";
import { createGrowthLeadFromListingAcquisition } from "@/lib/growth/lead-service";
import { generateFreeAcquisitionIntakeCode } from "@/lib/codes/generate-code";
import { getGuestId } from "@/lib/auth/session";
import { parseSessionUserId, TENANT_CONTEXT_COOKIE_NAME } from "@/lib/auth/session-cookie";
import { isBrokerVerified } from "@/lib/verification/broker";
import { ensureSellerContractsForFsboListing } from "@/lib/contracts/fsbo-seller-contracts";
import { ensureFsboListingDocumentSlots } from "@/lib/fsbo/seller-hub-seed-documents";
import { FSBO_MODERATION, FSBO_STATUS } from "@/lib/fsbo/constants";
import {
  INTAKE_MAX_FILES,
  INTAKE_MAX_PHOTOS,
  storeListingAcquisitionDocument,
  storeListingAcquisitionIdentityFile,
  storeListingAcquisitionPhoto,
} from "@/lib/listing-acquisition/store-intake-files";

export const dynamic = "force-dynamic";

const PERMISSION_ATTESTATION_ERROR = "You must confirm the publication attestation.";

function parseSourceType(raw: string): ListingAcquisitionSourceType | null {
  const u = raw.trim().toUpperCase();
  if (u === "OWNER") return ListingAcquisitionSourceType.OWNER;
  if (u === "BROKER") return ListingAcquisitionSourceType.BROKER;
  if (u === "HOST") return ListingAcquisitionSourceType.HOST;
  return null;
}

async function maybeCreateFsboDraftFromIntake(params: {
  leadId: string;
  intakeCode: string;
  ownerUserId: string;
  contactEmail: string;
  contactPhone: string | null;
  city: string;
  propertyCategory: string;
  description: string;
  priceCents: number | null;
  bedrooms: number | undefined;
  bathrooms: number | undefined;
  photoUrls: string[];
  permissionConfirmedAt: Date | null;
  sourcePlatformText: string | null;
}): Promise<{ fsboListingId: string } | null> {
  const user = await prisma.user.findUnique({
    where: { id: params.ownerUserId },
    select: { email: true, phone: true, sellerSellingMode: true },
  });
  if (!user?.email) return null;

  const brokerVerified = await isBrokerVerified(params.ownerUserId).catch(() => false);
  const listingOwnerType: FsboListingOwnerType =
    brokerVerified &&
    (user.sellerSellingMode === "PLATFORM_BROKER" || user.sellerSellingMode === "PREFERRED_BROKER")
      ? "BROKER"
      : "SELLER";

  const c = await cookies();
  const tenantId = parseSessionUserId(c.get(TENANT_CONTEXT_COOKIE_NAME)?.value);

  const priceCents =
    params.priceCents && params.priceCents > 0 ? params.priceCents : 100_000;
  const title = `${params.propertyCategory} — ${params.city}`.slice(0, 200);

  const fsbo = await prisma.$transaction(async (tx) => {
    const listing = await tx.fsboListing.create({
      data: {
        listingCode: params.intakeCode,
        listingOwnerType,
        owner: { connect: { id: params.ownerUserId } },
        ...(tenantId ? { tenant: { connect: { id: tenantId } } } : {}),
        title,
        description: params.description,
        priceCents,
        address: `Draft — ${params.city}`,
        city: params.city,
        contactEmail: params.contactEmail,
        contactPhone: params.contactPhone ?? user.phone ?? null,
        status: FSBO_STATUS.DRAFT,
        moderationStatus: FSBO_MODERATION.APPROVED,
        supplyPublicationStage: "draft",
        propertyType: params.propertyCategory.slice(0, 80),
        bedrooms: params.bedrooms ?? undefined,
        bathrooms: params.bathrooms ?? undefined,
        images: params.photoUrls,
        permissionConfirmedAt: params.permissionConfirmedAt,
        permissionSourceNote: params.sourcePlatformText,
        rewrittenDescriptionReviewed: false,
        imagesApproved: false,
        missingApprovedImages: params.photoUrls.length === 0,
        publishPlan: "basic",
      },
    });
    await tx.fsboListingVerification.create({ data: { fsboListingId: listing.id } });
    await tx.listingAcquisitionLead.update({
      where: { id: params.leadId },
      data: { linkedFsboListingId: listing.id, intakeStatus: "READY_FOR_REVIEW" },
    });
    return listing;
  });

  await ensureFsboListingDocumentSlots(fsbo.id);
  await ensureSellerContractsForFsboListing(fsbo.id).catch(() => {});

  return { fsboListingId: fsbo.id };
}

/** POST /api/listing-acquisition/intake — JSON (legacy) or multipart (files + fields). */
export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? "anon";
  const limit = checkRateLimit(`listing-acq:intake:${ip}`, { windowMs: 60_000, max: 10 });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Try again shortly." },
      { status: 429, headers: getRateLimitHeaders(limit) }
    );
  }

  const contentType = req.headers.get("content-type") ?? "";
  if (contentType.includes("multipart/form-data")) {
    return handleMultipart(req, limit);
  }
  return handleJson(req, limit);
}

async function handleJson(req: Request, limit: ReturnType<typeof checkRateLimit>) {
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
    return NextResponse.json({ error: PERMISSION_ATTESTATION_ERROR }, { status: 400 });
  }

  const { text: description } = normalizeListingDescription(descriptionRaw);
  if (!description || description.length < 20) {
    return NextResponse.json(
      { error: "Please add a short original description (at least 20 characters)." },
      { status: 400 }
    );
  }

  const sessionUserId = await getGuestId();

  const row = await prisma.$transaction(async (tx) => {
    const intakeCode = await generateFreeAcquisitionIntakeCode(tx);
    return tx.listingAcquisitionLead.create({
      data: {
        intakeCode,
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
        submittedDocumentUrls: [],
        identityDocumentUrl: null,
      },
    });
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

  let fsboListingId: string | undefined;
  const canAutoLinkFsbo =
    sessionUserId &&
    (sourceType === ListingAcquisitionSourceType.OWNER ||
      sourceType === ListingAcquisitionSourceType.BROKER);
  if (canAutoLinkFsbo) {
    const linked = await maybeCreateFsboDraftFromIntake({
      leadId: row.id,
      intakeCode: row.intakeCode!,
      ownerUserId: sessionUserId,
      contactEmail,
      contactPhone: contactPhone || null,
      city,
      propertyCategory,
      description,
      priceCents: priceCents ?? null,
      bedrooms,
      bathrooms,
      photoUrls: imageUrls,
      permissionConfirmedAt: row.permissionConfirmedAt,
      sourcePlatformText: sourcePlatformText || null,
    });
    fsboListingId = linked?.fsboListingId;
  }

  return NextResponse.json(
    {
      ok: true,
      id: row.id,
      intakeCode: row.intakeCode,
      fsboListingId,
      dashboardLinked: Boolean(fsboListingId),
    },
    { status: 201, headers: getRateLimitHeaders(limit) }
  );
}

function formBool(v: FormDataEntryValue | null): boolean {
  if (v == null) return false;
  if (typeof v === "string") {
    const t = v.trim().toLowerCase();
    return t === "true" || t === "on" || t === "1";
  }
  return false;
}

async function handleMultipart(req: Request, limit: ReturnType<typeof checkRateLimit>) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const sourceType = typeof form.get("sourceType") === "string" ? parseSourceType(form.get("sourceType") as string) : null;
  const contactName = typeof form.get("contactName") === "string" ? (form.get("contactName") as string).trim() : "";
  const contactEmail =
    typeof form.get("contactEmail") === "string" ? (form.get("contactEmail") as string).trim().toLowerCase() : "";
  const contactPhone =
    typeof form.get("contactPhone") === "string" ? (form.get("contactPhone") as string).trim() : undefined;
  const city = typeof form.get("city") === "string" ? (form.get("city") as string).trim() : "";
  const propertyCategory =
    typeof form.get("propertyCategory") === "string" ? (form.get("propertyCategory") as string).trim() : "";
  const descriptionRaw = typeof form.get("description") === "string" ? (form.get("description") as string) : "";
  const amenitiesText =
    typeof form.get("amenitiesText") === "string" ? (form.get("amenitiesText") as string).trim() : undefined;
  const sourcePlatformText =
    typeof form.get("sourcePlatformText") === "string"
      ? (form.get("sourcePlatformText") as string).trim().slice(0, 2000)
      : undefined;
  const permissionConfirm = formBool(form.get("permissionConfirm"));
  const priceCadRaw = typeof form.get("priceCad") === "string" ? (form.get("priceCad") as string) : "";
  const priceNum = parseFloat(priceCadRaw.replace(/[^0-9.]/g, ""));
  const priceCents = Number.isFinite(priceNum) && priceNum > 0 ? Math.round(priceNum * 100) : undefined;
  const bedroomsRaw = typeof form.get("bedrooms") === "string" ? (form.get("bedrooms") as string).trim() : "";
  const bathroomsRaw = typeof form.get("bathrooms") === "string" ? (form.get("bathrooms") as string).trim() : "";
  const bedrooms = bedroomsRaw ? parseInt(bedroomsRaw, 10) : undefined;
  const bathrooms = bathroomsRaw ? parseFloat(bathroomsRaw) : undefined;

  const identity = form.get("identity");
  const photoEntries = form.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  const docEntries = form.getAll("documents").filter((f): f is File => f instanceof File && f.size > 0);

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
    return NextResponse.json({ error: PERMISSION_ATTESTATION_ERROR }, { status: 400 });
  }

  const { text: description } = normalizeListingDescription(descriptionRaw);
  if (!description || description.length < 20) {
    return NextResponse.json(
      { error: "Please add a short original description (at least 20 characters)." },
      { status: 400 }
    );
  }

  if (!(identity instanceof File) || identity.size === 0) {
    return NextResponse.json(
      { error: "Government-issued identification upload is required." },
      { status: 400 }
    );
  }
  if (photoEntries.length < 1 || photoEntries.length > INTAKE_MAX_PHOTOS) {
    return NextResponse.json(
      { error: `Add between 1 and ${INTAKE_MAX_PHOTOS} property photos.` },
      { status: 400 }
    );
  }
  const totalFiles = 1 + photoEntries.length + docEntries.length;
  if (totalFiles > INTAKE_MAX_FILES) {
    return NextResponse.json(
      { error: `You can upload at most ${INTAKE_MAX_FILES} files in total (ID + photos + documents).` },
      { status: 400 }
    );
  }

  const sessionUserId = await getGuestId();

  const row = await prisma.$transaction(async (tx) => {
    const intakeCode = await generateFreeAcquisitionIntakeCode(tx);
    return tx.listingAcquisitionLead.create({
      data: {
        intakeCode,
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
        submittedImageUrls: [],
        submittedDocumentUrls: [],
        identityDocumentUrl: null,
      },
    });
  });

  let identityUrl: string | null = null;
  const photoUrls: string[] = [];
  const documentUrls: string[] = [];

  try {
    const idBuf = Buffer.from(await identity.arrayBuffer());
    identityUrl = await storeListingAcquisitionIdentityFile({
      leadId: row.id,
      buffer: idBuf,
      contentType: identity.type || "application/octet-stream",
    });

    for (const f of photoEntries) {
      const buf = Buffer.from(await f.arrayBuffer());
      const url = await storeListingAcquisitionPhoto({
        leadId: row.id,
        buffer: buf,
        contentType: f.type || "image/jpeg",
      });
      photoUrls.push(url);
    }

    for (const f of docEntries) {
      const buf = Buffer.from(await f.arrayBuffer());
      const url = await storeListingAcquisitionDocument({
        leadId: row.id,
        buffer: buf,
        contentType: f.type || "application/pdf",
      });
      documentUrls.push(url);
    }
  } catch (e) {
    await prisma.listingAcquisitionLead.delete({ where: { id: row.id } }).catch(() => {});
    const msg = e instanceof Error ? e.message : "Upload failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  await prisma.listingAcquisitionLead.update({
    where: { id: row.id },
    data: {
      identityDocumentUrl: identityUrl,
      submittedImageUrls: photoUrls,
      submittedDocumentUrls: documentUrls,
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

  let fsboListingId: string | undefined;
  const canAutoLinkFsbo =
    sessionUserId &&
    row.intakeCode &&
    (sourceType === ListingAcquisitionSourceType.OWNER ||
      sourceType === ListingAcquisitionSourceType.BROKER);
  if (canAutoLinkFsbo) {
    const linked = await maybeCreateFsboDraftFromIntake({
      leadId: row.id,
      intakeCode: row.intakeCode,
      ownerUserId: sessionUserId,
      contactEmail,
      contactPhone: contactPhone || null,
      city,
      propertyCategory,
      description,
      priceCents: priceCents ?? null,
      bedrooms,
      bathrooms,
      photoUrls,
      permissionConfirmedAt: row.permissionConfirmedAt,
      sourcePlatformText: sourcePlatformText || null,
    });
    fsboListingId = linked?.fsboListingId;
  }

  return NextResponse.json(
    {
      ok: true,
      id: row.id,
      intakeCode: row.intakeCode,
      fsboListingId,
      dashboardLinked: Boolean(fsboListingId),
    },
    { status: 201, headers: getRateLimitHeaders(limit) }
  );
}
