import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";
import {
  FSBO_ALLOWED_IMAGE_MIME,
  FSBO_MAX_IMAGE_BYTES,
} from "@/lib/fsbo/media-config";
import { uploadFsboListingImage } from "@/lib/fsbo/upload-fsbo-listing-image";
import { requireContentLicenseAccepted } from "@/lib/legal/content-license-enforcement";
import { getFsboMaxPhotosForSellerPlan } from "@/lib/fsbo/photo-limits";
import sharp from "sharp";

export const dynamic = "force-dynamic";

/**
 * POST multipart/form-data: field `file` — one image (jpeg/png/webp), max 5MB.
 * Owner-only; listing must exist (any non-SOLD status for edits).
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const userId = await getGuestId();
  if (!userId) {
    return Response.json({ error: "Sign in required" }, { status: 401 });
  }

  const listing = await prisma.fsboListing.findUnique({
    where: { id },
    select: { ownerId: true, status: true, images: true },
  });
  if (!listing || listing.ownerId !== userId) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  if (listing.status === "SOLD") {
    return Response.json({ error: "Sold listings cannot be edited" }, { status: 409 });
  }

  const licenseBlock = await requireContentLicenseAccepted(userId);
  if (licenseBlock) return licenseBlock;

  // Plan-based photo limits (DIY seller subscription tiers, not publish plan).
  const me = await prisma.user.findUnique({
    where: { id: userId },
    select: { sellerPlan: true },
  });
  const maxPhotos = getFsboMaxPhotosForSellerPlan(me?.sellerPlan);
  if (listing.images.length >= maxPhotos) {
    return Response.json(
      { error: "You reached your plan limit. Upgrade to upload more photos." },
      { status: 409 }
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: "Expected multipart form data" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "file field required" }, { status: 400 });
  }

  if (file.size > FSBO_MAX_IMAGE_BYTES) {
    return Response.json({ error: "Image too large (max 5MB)" }, { status: 400 });
  }

  const inputType = (file.type ?? "").toLowerCase();
  const fileName = file.name ?? "";
  const ext = fileName.includes(".") ? fileName.split(".").pop()?.toLowerCase() : undefined;

  const buffer = Buffer.from(await file.arrayBuffer());

  const resolveImage = async (): Promise<{ buffer: Buffer; contentType: string }> => {
    // Prefer declared mime when present.
    if (inputType && FSBO_ALLOWED_IMAGE_MIME.has(inputType)) {
      return { buffer, contentType: inputType };
    }

    // Extension fallback (fixes incorrect rejections when `file.type` is missing).
    if (ext === "jpg" || ext === "jpeg") return { buffer, contentType: "image/jpeg" };
    if (ext === "png") return { buffer, contentType: "image/png" };
    if (ext === "webp") return { buffer, contentType: "image/webp" };

    // Optional HEIC/HEIF support: convert to JPG.
    if (ext === "heic" || ext === "heif" || inputType === "image/heic" || inputType === "image/heif") {
      const converted = await sharp(buffer).jpeg({ quality: 85 }).toBuffer();
      return { buffer: converted, contentType: "image/jpeg" };
    }

    throw new Error("Unsupported image format");
  };

  try {
    const { buffer: finalBuffer, contentType } = await resolveImage();
    const { url } = await uploadFsboListingImage({
      listingId: id,
      buffer: finalBuffer,
      contentType,
    });
    return Response.json({ url });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Upload failed";
    if (message === "Unsupported image format") {
      return Response.json(
        { error: "Upload failed. Please check file format or size." },
        { status: 400 }
      );
    }
    return Response.json({ error: message }, { status: 500 });
  }
}
