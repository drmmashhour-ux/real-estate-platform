import { mkdir, writeFile } from "fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import {
  FSBO_ALLOWED_IMAGE_MIME,
  FSBO_IMAGE_EXTENSION_BY_MIME,
  FSBO_STORAGE_FOLDER_SEGMENT,
} from "@/lib/fsbo/media-config";
import { generateImageVariants } from "@/lib/images/process-image";
import { smartCrop } from "@/lib/images/smart-crop";
import { scanBufferBeforeStorage } from "@/lib/security/malware-scan";

function getBucketName(): string {
  return process.env.FSBO_SUPABASE_BUCKET?.trim() || "fsbo-media";
}

/** Public base for absolute URLs (optional — falls back to path-absolute `/uploads/...`). */
function appPublicOrigin(): string {
  const o = process.env.NEXT_PUBLIC_APP_ORIGIN?.replace(/\/$/, "");
  if (o) return o;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL.replace(/^https?:\/\//, "")}`;
  return "";
}

export type FsboImageUploadResult = { url: string } | { error: string; status?: number };

export type FsboImageBundleUploadResult =
  | {
      /** Primary URL stored in listing.images — optimized full JPEG */
      url: string;
      urls: {
        original: string;
        thumb: string;
        preview: string;
        full: string;
      };
    }
  | { error: string; status?: number };

/**
 * Writes one object under fsbo/{listingId}/{relativeObjectPath}. Nested paths allowed (`assetId/full.jpg`).
 */
async function writeFsboListingObject(params: {
  listingId: string;
  relativeObjectPath: string;
  buffer: Buffer;
  contentType: string;
  upsert?: boolean;
}): Promise<FsboImageUploadResult> {
  const { listingId, relativeObjectPath, buffer, contentType, upsert } = params;
  const normalized = relativeObjectPath.replace(/^\/+/, "").replace(/\\/g, "/");
  const relativePath = `${FSBO_STORAGE_FOLDER_SEGMENT}/${listingId}/${normalized}`;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (supabaseUrl && serviceKey) {
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const bucket = getBucketName();
    const { error } = await admin.storage.from(bucket).upload(relativePath, buffer, {
      contentType,
      upsert: Boolean(upsert),
    });
    if (error) {
      return { error: error.message || "Storage upload failed", status: 500 };
    }
    const { data } = admin.storage.from(bucket).getPublicUrl(relativePath);
    if (!data?.publicUrl) {
      return { error: "Could not build public URL for upload", status: 500 };
    }
    return { url: data.publicUrl };
  }

  try {
    const segments = normalized.split("/").filter(Boolean);
    const fileName = segments.pop() ?? "file.bin";
    const baseDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      FSBO_STORAGE_FOLDER_SEGMENT,
      listingId,
      ...segments,
    );
    await mkdir(baseDir, { recursive: true });
    const diskPath = path.join(baseDir, fileName);
    await writeFile(diskPath, buffer);

    const origin = appPublicOrigin();
    const publicSuffix = [FSBO_STORAGE_FOLDER_SEGMENT, listingId, ...segments, fileName].join("/");
    const publicPath = `/uploads/${publicSuffix}`;
    return { url: origin ? `${origin}${publicPath}` : publicPath };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Upload failed";
    return { error: msg, status: 500 };
  }
}

/**
 * Upload a single validated image buffer. Returns a URL suitable to store in `FsboListing.images`.
 */
export async function uploadFsboListingImage(params: {
  listingId: string;
  buffer: Buffer;
  contentType: string;
}): Promise<FsboImageUploadResult> {
  const { listingId, buffer, contentType } = params;
  if (!FSBO_ALLOWED_IMAGE_MIME.has(contentType)) {
    return { error: "Unsupported image type", status: 400 };
  }
  const ext = FSBO_IMAGE_EXTENSION_BY_MIME[contentType];
  if (!ext) return { error: "Unsupported image type", status: 400 };

  const scan = await scanBufferBeforeStorage({
    bytes: buffer,
    mimeType: contentType,
    context: "fsbo_listing_image",
  });
  if (!scan.ok) {
    return { error: scan.userMessage, status: scan.status };
  }

  const objectName = `${randomUUID()}.${ext}`;
  return writeFsboListingObject({
    listingId,
    relativeObjectPath: objectName,
    buffer,
    contentType,
  });
}

/**
 * Upload original bytes plus Sharp-generated thumb / preview / full JPEGs (non-destructive archive).
 */
export async function uploadFsboListingImageBundle(params: {
  listingId: string;
  /** Bytes stored as `original.*` in the asset bundle (uncropped upload). */
  buffer: Buffer;
  contentType: string;
  /** Mild square center crop before pipeline — optional; off by default for natural framing */
  safeCenterCrop?: boolean;
  /** Attention-based crop before optimize — ignored when `pipelineBuffer` is passed. */
  smartCropAttention?: boolean;
  /**
   * Precomputed pipeline input (e.g. after {@link smartCrop}). When omitted, crop runs here when enabled.
   * Archive bytes always come from `buffer`.
   */
  pipelineBuffer?: Buffer;
}): Promise<FsboImageBundleUploadResult> {
  const { listingId, buffer, contentType, safeCenterCrop, smartCropAttention, pipelineBuffer: pipelineProvided } =
    params;
  if (!FSBO_ALLOWED_IMAGE_MIME.has(contentType)) {
    return { error: "Unsupported image type", status: 400 };
  }
  const origExt = FSBO_IMAGE_EXTENSION_BY_MIME[contentType];
  if (!origExt) return { error: "Unsupported image type", status: 400 };

  const scan = await scanBufferBeforeStorage({
    bytes: buffer,
    mimeType: contentType,
    context: "fsbo_listing_image",
  });
  if (!scan.ok) {
    return { error: scan.userMessage, status: scan.status };
  }

  let variants;
  try {
    const archiveBuffer = Buffer.from(buffer);
    let pipelineBuffer = pipelineProvided ? Buffer.from(pipelineProvided) : Buffer.from(buffer);
    if (!pipelineProvided && smartCropAttention !== false) {
      pipelineBuffer = await smartCrop(pipelineBuffer);
    }
    variants = await generateImageVariants(pipelineBuffer, {
      safeCenterCrop: Boolean(safeCenterCrop) && !pipelineProvided && smartCropAttention === false,
      archiveOriginal: archiveBuffer,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Image processing failed";
    return { error: msg, status: 400 };
  }

  const assetId = randomUUID();
  const prefix = `${assetId}`;

  const uploads: Promise<FsboImageUploadResult>[] = [
    writeFsboListingObject({
      listingId,
      relativeObjectPath: `${prefix}/original.${origExt}`,
      buffer: variants.original,
      contentType,
    }),
    writeFsboListingObject({
      listingId,
      relativeObjectPath: `${prefix}/thumb.jpg`,
      buffer: variants.thumb,
      contentType: "image/jpeg",
    }),
    writeFsboListingObject({
      listingId,
      relativeObjectPath: `${prefix}/preview.jpg`,
      buffer: variants.preview,
      contentType: "image/jpeg",
    }),
    writeFsboListingObject({
      listingId,
      relativeObjectPath: `${prefix}/full.jpg`,
      buffer: variants.full,
      contentType: "image/jpeg",
    }),
  ];

  const results = await Promise.all(uploads);
  for (const r of results) {
    if ("error" in r) return r;
  }

  const urls = {
    original: (results[0] as { url: string }).url,
    thumb: (results[1] as { url: string }).url,
    preview: (results[2] as { url: string }).url,
    full: (results[3] as { url: string }).url,
  };

  return {
    url: urls.full,
    urls,
  };
}

/**
 * Re-run Sharp pipeline on an existing asset folder — overwrites thumb/preview/full only (original kept).
 */
export async function overwriteFsboListingDerivedVariants(params: {
  listingId: string;
  assetFolderId: string;
  thumb: Buffer;
  preview: Buffer;
  full: Buffer;
}): Promise<FsboImageUploadResult | { error: string; status?: number }> {
  const { listingId, assetFolderId, thumb, preview, full } = params;
  const base = `${assetFolderId}`;
  const outs = await Promise.all([
    writeFsboListingObject({
      listingId,
      relativeObjectPath: `${base}/thumb.jpg`,
      buffer: thumb,
      contentType: "image/jpeg",
      upsert: true,
    }),
    writeFsboListingObject({
      listingId,
      relativeObjectPath: `${base}/preview.jpg`,
      buffer: preview,
      contentType: "image/jpeg",
      upsert: true,
    }),
    writeFsboListingObject({
      listingId,
      relativeObjectPath: `${base}/full.jpg`,
      buffer: full,
      contentType: "image/jpeg",
      upsert: true,
    }),
  ]);
  for (const r of outs) {
    if ("error" in r) return r;
  }
  return { url: (outs[2] as { url: string }).url };
}
