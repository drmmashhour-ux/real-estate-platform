import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
import { fsboImageFolderUrl, parseFsboBundledAssetId } from "@/lib/fsbo/fsbo-image-utils";
import { generateImageVariants } from "@/lib/images/process-image";
import { smartCrop } from "@/lib/images/smart-crop";
import { overwriteFsboListingDerivedVariants } from "@/lib/fsbo/upload-fsbo-listing-image";

const prisma = getLegacyDB();

export const dynamic = "force-dynamic";

async function fetchBufferFromPublicUrl(url: string): Promise<Buffer> {
  let target = url;
  if (url.startsWith("/")) {
    const origin =
      process.env.NEXT_PUBLIC_APP_ORIGIN?.replace(/\/$/, "") ?? "http://127.0.0.1:3001";
    target = `${origin}${url}`;
  }
  const res = await fetch(target, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Fetch failed (${res.status})`);
  }
  return Buffer.from(await res.arrayBuffer());
}

async function loadOriginalFromFolder(folderUrl: string): Promise<{ buffer: Buffer; originalPublicUrl: string } | null> {
  const base = folderUrl.replace(/\/$/, "");
  for (const ext of ["jpg", "jpeg", "png", "webp"]) {
    const originalPublicUrl = `${base}/original.${ext}`;
    try {
      const buf = await fetchBufferFromPublicUrl(originalPublicUrl);
      if (buf.length > 64) return { buffer: buf, originalPublicUrl };
    } catch {
      /* try next */
    }
  }
  return null;
}

/**
 * POST JSON `{ imageUrl: string }` — re-runs enhancement from archived original (thumb/preview/full overwritten).
 */
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id: listingId } = await context.params;
  const userId = await getGuestId();
  if (!userId) {
    return Response.json({ error: "Sign in required" }, { status: 401 });
  }

  const listing = await prisma.fsboListing.findUnique({
    where: { id: listingId },
    select: { ownerId: true, status: true },
  });
  if (!listing || listing.ownerId !== userId) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  if (listing.status === "SOLD") {
    return Response.json({ error: "Sold listings cannot be edited" }, { status: 409 });
  }

  let body: { imageUrl?: string; smartCrop?: boolean };
  try {
    body = (await request.json()) as { imageUrl?: string; smartCrop?: boolean };
  } catch {
    return Response.json({ error: "Expected JSON body" }, { status: 400 });
  }

  const imageUrl = typeof body.imageUrl === "string" ? body.imageUrl.trim() : "";
  const useSmartCrop = body.smartCrop === true;
  if (!imageUrl || !imageUrl.includes(`/fsbo/${listingId}/`)) {
    return Response.json({ error: "Invalid image URL for this listing" }, { status: 400 });
  }

  const assetId = parseFsboBundledAssetId(imageUrl, listingId);
  if (!assetId) {
    return Response.json(
      { error: "This photo uses a legacy layout — re-upload to enable enhancement tools." },
      { status: 400 },
    );
  }

  const folderUrl = fsboImageFolderUrl(imageUrl.split(/[?#]/)[0] ?? imageUrl);

  let loaded: { buffer: Buffer; originalPublicUrl: string } | null = null;
  try {
    loaded = await loadOriginalFromFolder(folderUrl);
  } catch {
    loaded = null;
  }
  if (!loaded) {
    return Response.json({ error: "Could not load archived original image." }, { status: 400 });
  }
  const originalBuf = loaded.buffer;

  let variants;
  try {
    let pipelineInput = Buffer.from(originalBuf);
    if (useSmartCrop) {
      pipelineInput = await smartCrop(pipelineInput);
    }
    variants = await generateImageVariants(pipelineInput, {
      safeCenterCrop: process.env.FSBO_IMAGE_SAFE_CENTER_CROP === "1" && !useSmartCrop,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Processing failed";
    return Response.json({ error: msg }, { status: 400 });
  }

  const up = await overwriteFsboListingDerivedVariants({
    listingId,
    assetFolderId: assetId,
    thumb: variants.thumb,
    preview: variants.preview,
    full: variants.full,
  });

  if ("error" in up) {
    return Response.json({ error: up.error }, { status: up.status ?? 500 });
  }

  const bust = Date.now();
  const baseFolder = folderUrl.replace(/\/$/, "");
  return Response.json({
    url: `${up.url.split(/[?#]/)[0]}?t=${bust}`,
    urls: {
      original: loaded.originalPublicUrl,
      full: `${baseFolder}/full.jpg?t=${bust}`,
      preview: `${baseFolder}/preview.jpg?t=${bust}`,
      thumb: `${baseFolder}/thumb.jpg?t=${bust}`,
    },
  });
}
