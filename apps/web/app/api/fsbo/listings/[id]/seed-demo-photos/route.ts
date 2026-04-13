import { existsSync } from "fs";
import { readFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";
import { assessListingPhotoForPropertyUse } from "@/lib/fsbo/assess-listing-photo-relevance";
import {
  DEMO_FOOD_REJECTION_TEST_IMAGE_URL,
  DEMO_PROPERTY_PHOTO_LOCAL_COUNT,
  DEMO_PROPERTY_PHOTO_SEED_URLS,
  DEMO_PROPERTY_PHOTO_TAGS,
  isDemoListingPhotoSeedAllowed,
} from "@/lib/fsbo/demo-listing-photo-assets";
import { FSBO_MAX_IMAGE_BYTES } from "@/lib/fsbo/media-config";
import { getFsboMaxPhotosForSellerPlan } from "@/lib/fsbo/photo-limits";
import { uploadFsboListingImage } from "@/lib/fsbo/upload-fsbo-listing-image";
import { requireContentLicenseAccepted } from "@/lib/legal/content-license-enforcement";
import { isOpenAiConfigured } from "@/lib/ai/openai";
import sharp from "sharp";

export const dynamic = "force-dynamic";

const FETCH_UA = "RealEstatePlatform-FSBO-Demo/1.0 (listing photo seed examples)";

const DEMO_LOCAL_DIR = path.join(process.cwd(), "public", "demo-fsbo-listing");

async function fetchRemoteImageBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url, {
    redirect: "follow",
    headers: { "User-Agent": FETCH_UA, Accept: "image/*" },
  });
  if (!res.ok) {
    throw new Error(`Could not download example image (${res.status})`);
  }
  const ab = await res.arrayBuffer();
  return Buffer.from(ab);
}

/** Load demo asset `index` (0…DEMO_PROPERTY_PHOTO_LOCAL_COUNT-1) — prefers `public/demo-fsbo-listing/{index+1}.jpg`, then remote URL. */
async function loadDemoPropertyRaw(index: number): Promise<Buffer | null> {
  const safe = Math.max(0, Math.min(index, DEMO_PROPERTY_PHOTO_LOCAL_COUNT - 1));
  const localPath = path.join(DEMO_LOCAL_DIR, `${safe + 1}.jpg`);
  if (existsSync(localPath)) {
    return readFile(localPath);
  }
  const url = DEMO_PROPERTY_PHOTO_SEED_URLS[safe];
  if (!url) return null;
  try {
    return await fetchRemoteImageBuffer(url);
  } catch {
    return null;
  }
}

async function toJpegForUpload(buf: Buffer): Promise<Buffer> {
  return sharp(buf).rotate().jpeg({ quality: 88 }).toBuffer();
}

function listingPhotoAiGateActive(): boolean {
  if (process.env.FSBO_LISTING_PHOTO_AI_CHECK === "false") return false;
  return isOpenAiConfigured();
}

function normalizeTagsForAppend(
  existingCount: number,
  count: number
): string[] {
  const base = DEMO_PROPERTY_PHOTO_TAGS.slice(0, count);
  if (existingCount === 0) return [...base];
  return base.map((t) => (t === "EXTERIOR" ? "INTERIOR" : t));
}

/**
 * POST JSON `{ "mode"?: "property" | "food_test" }`
 * - `property` (default): downloads example property photos, runs the same checks as manual upload, appends to gallery.
 * - `food_test`: assesses a food image only (does not store). For QA when demo tools are enabled.
 */
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!isDemoListingPhotoSeedAllowed()) {
    return Response.json({ error: "Demo photo tools are not enabled in this environment." }, { status: 403 });
  }

  const userId = await getGuestId();
  if (!userId) {
    return Response.json({ error: "Sign in required" }, { status: 401 });
  }

  let body: { mode?: string };
  try {
    body = (await request.json()) as { mode?: string };
  } catch {
    body = {};
  }
  const mode = body.mode === "food_test" ? "food_test" : "property";

  const listing = await prisma.fsboListing.findUnique({
    where: { id },
    select: {
      ownerId: true,
      status: true,
      images: true,
      photoTagsJson: true,
      propertyType: true,
    },
  });
  if (!listing || listing.ownerId !== userId) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  if (listing.status === "SOLD") {
    return Response.json({ error: "Sold listings cannot be edited" }, { status: 409 });
  }

  if (mode === "food_test") {
    try {
      const raw = await fetchRemoteImageBuffer(DEMO_FOOD_REJECTION_TEST_IMAGE_URL);
      const jpeg = await toJpegForUpload(raw);
      if (jpeg.length > FSBO_MAX_IMAGE_BYTES) {
        return Response.json({ error: "Demo food image too large after processing." }, { status: 400 });
      }
      const relevance = await assessListingPhotoForPropertyUse(jpeg, {
        propertyType: listing.propertyType,
      });
      const aiActive = listingPhotoAiGateActive();
      const userMessage = relevance.ok
        ? aiActive
          ? "Sample food image was accepted (unexpected for a food-only shot). Check vision model behavior."
          : "Sample food image was accepted because AI listing-photo screening is off or OpenAI is not configured — in production with AI enabled, food-style images are usually rejected."
        : relevance.userMessage;
      return Response.json({
        rejected: !relevance.ok,
        userMessage,
        aiCheckActive: aiActive,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Food demo check failed";
      return Response.json({ error: msg }, { status: 502 });
    }
  }

  const licenseBlock = await requireContentLicenseAccepted(userId);
  if (licenseBlock) return licenseBlock;

  const me = await prisma.user.findUnique({
    where: { id: userId },
    select: { sellerPlan: true },
  });
  const maxPhotos = getFsboMaxPhotosForSellerPlan(me?.sellerPlan);
  const existing = Array.isArray(listing.images) ? (listing.images as string[]) : [];
  const remaining = Math.max(0, maxPhotos - existing.length);
  if (remaining < 1) {
    return Response.json(
      { error: "Your gallery is full. Remove a photo or upgrade your plan to add examples." },
      { status: 409 }
    );
  }

  const startIdx = existing.length;
  const slotsToAdd = Math.min(remaining, DEMO_PROPERTY_PHOTO_LOCAL_COUNT - startIdx);
  if (slotsToAdd < 1) {
    return Response.json(
      {
        error:
          "Example set is already fully added for this listing, or the gallery has more photos than the demo pack supports.",
      },
      { status: 409 }
    );
  }

  const tagPlan = normalizeTagsForAppend(existing.length, slotsToAdd);
  const newUrls: string[] = [];
  const newTagsOrdered: string[] = [];

  for (let j = 0; j < slotsToAdd; j++) {
    const i = startIdx + j;
    try {
      const raw = await loadDemoPropertyRaw(i);
      if (!raw) continue;
      const jpeg = await toJpegForUpload(raw);
      if (jpeg.length > FSBO_MAX_IMAGE_BYTES) continue;

      const relevance = await assessListingPhotoForPropertyUse(jpeg, {
        propertyType: listing.propertyType,
        role: existing.length === 0 && j === 0 ? "cover" : "additional",
      });
      if (!relevance.ok) continue;

      const up = await uploadFsboListingImage({
        listingId: id,
        buffer: jpeg,
        contentType: "image/jpeg",
      });
      if ("error" in up) continue;
      newUrls.push(up.url);
      newTagsOrdered.push(tagPlan[j] ?? "OTHER");
    } catch {
      // skip failed example
    }
  }

  if (newUrls.length === 0) {
    return Response.json(
      {
        error:
          "Could not add example photos (download failed or images were rejected). Check your connection or try again.",
      },
      { status: 502 }
    );
  }

  const tagsExisting = Array.isArray(listing.photoTagsJson)
    ? (listing.photoTagsJson as unknown[]).filter((t): t is string => typeof t === "string")
    : [];
  const paddedExisting: string[] = existing.map((_, i) => {
    const t = tagsExisting[i];
    const u = typeof t === "string" ? t.toUpperCase() : "";
    if (u === "EXTERIOR" || u === "INTERIOR" || u === "STREET_VIEW" || u === "OTHER") return u;
    return i === 0 ? "EXTERIOR" : "OTHER";
  });
  while (paddedExisting.length < existing.length) {
    paddedExisting.push(paddedExisting.length === 0 ? "EXTERIOR" : "OTHER");
  }

  const mergedTags = [...paddedExisting.slice(0, existing.length), ...newTagsOrdered];

  const nextImages = [...existing, ...newUrls].slice(0, maxPhotos);

  await prisma.fsboListing.update({
    where: { id },
    data: {
      images: nextImages,
      coverImage: nextImages[0] ?? null,
      photoTagsJson: mergedTags.slice(0, nextImages.length) as unknown as object,
      photoVerificationStatus: "PENDING",
      photoConfirmationAcceptedAt: null,
    },
  });

  return Response.json({
    added: newUrls.length,
    images: nextImages,
    photoTagsJson: mergedTags.slice(0, nextImages.length),
  });
}
