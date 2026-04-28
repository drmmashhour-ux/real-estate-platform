/**
 * Client helpers for quick-post listing images.
 *
 * ORDER SYBNB-80 — Server-side normalization (`normalizeListingImagesForPersist`).
 * ORDER SYBNB-83 — Aggressive client compression when Cloudinary is unavailable (dev / fallback).
 * ORDER SYBNB-80 — Server-side normalization (`normalizeListingImagesForPersist`).
 * ORDER SYBNB-83 — Aggressive client compression when Cloudinary is unavailable (dev / fallback).
 * ORDER SYBNB-90 — Prefer `/api/listings/images` (batch CDN upload); `/api/listings/upload-image` remains single-file compatible.
 */

export const MAX_LISTING_IMAGES = 5;

/** ORDER SYBNB-100 — deed/proof uploads per listing (Cloudinary). */
export const MAX_PROPERTY_PROOF_DOCUMENTS = 5;

/** Max JSON body for `/api/listings/create` & hotel onboard — ORDER SYBNB-83 (platform / proxies). */
export const MAX_LISTING_CREATE_PAYLOAD_BYTES = 2 * 1024 * 1024;

/** Budget for base64 image strings inside JSON (leave room for titles, phone, etc.). */
export const MAX_LISTING_IMAGES_JSON_CHARS_BUDGET = Math.floor(MAX_LISTING_CREATE_PAYLOAD_BYTES * 0.88);

/** Input file cap before compression — reject huge sources early. */
export const MAX_IMAGE_FILE_BYTES = 2 * 1024 * 1024;

/** Canonical listing-photo width ceiling — mirrored server-side in sharp resize (`server-listing-images`). */
export const MAX_IMAGE_WIDTH = 720;

/** ORDER SYBNB-83 — Target decoded JPEG size per image (100–150 KB band). */
export const TARGET_JPEG_MAX_BYTES = 125 * 1024;

/** Middle of quality iteration — tuned for ~125 KB @ 720px max edge (SYBNB-83). */
export const JPEG_QUALITY_DEFAULT = 0.62;
/** @deprecated Use JPEG_QUALITY_DEFAULT — kept for callers importing JPEG_QUALITY */
export const JPEG_QUALITY = JPEG_QUALITY_DEFAULT;
const JPEG_QUALITY_MIN = 0.38;

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result ?? ""));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

/** Approximate decoded byte length of a data URL payload (base64 segment). */
export function approxDataUrlDecodedBytes(dataUrl: string): number {
  const comma = dataUrl.indexOf(",");
  if (comma < 0) return Math.floor(dataUrl.length * 0.75);
  const b64 = dataUrl.slice(comma + 1);
  let padding = 0;
  if (b64.endsWith("==")) padding = 2;
  else if (b64.endsWith("=")) padding = 1;
  return Math.floor((b64.length * 3) / 4) - padding;
}

/**
 * Resize + iterative JPEG quality until under TARGET_JPEG_MAX_BYTES (SYBNB-83).
 */
async function bitmapToJpegDataUrlUnderBudget(bitmap: ImageBitmap): Promise<string> {
  let scale = Math.min(1, MAX_IMAGE_WIDTH / Math.max(bitmap.width, bitmap.height));

  for (let pass = 0; pass < 6; pass++) {
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) break;
    ctx.drawImage(bitmap, 0, 0, w, h);

    let q = JPEG_QUALITY_DEFAULT;
    while (q >= JPEG_QUALITY_MIN - 1e-9) {
      const url = canvas.toDataURL("image/jpeg", q);
      if (approxDataUrlDecodedBytes(url) <= TARGET_JPEG_MAX_BYTES) {
        return url;
      }
      q -= 0.055;
    }
    scale *= 0.84;
  }

  return bitmapToLossyDataUrlMinimal(bitmap);
}

function bitmapToLossyDataUrlMinimal(bitmap: ImageBitmap): string {
  const w = Math.max(1, Math.round(bitmap.width * 0.2));
  const h = Math.max(1, Math.round(bitmap.height * 0.2));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  ctx.drawImage(bitmap, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", JPEG_QUALITY_MIN);
}

/**
 * Per-file JPEG compression toward SYBNB-83 size target.
 * Falls back to raw data URL only when canvas APIs fail — oversized raw URLs are dropped by callers.
 */
export async function compressImageFileToDataUrl(file: File): Promise<string> {
  if (typeof createImageBitmap === "undefined") {
    const raw = await readFileAsDataUrl(file);
    return approxDataUrlDecodedBytes(raw) <= TARGET_JPEG_MAX_BYTES * 2 ? raw : "";
  }
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return "";
  }
  try {
    if (bitmap.width <= 0 || bitmap.height <= 0) {
      return "";
    }
    return await bitmapToJpegDataUrlUnderBudget(bitmap);
  } finally {
    bitmap.close();
  }
}

export type CompressListingImagesResult = {
  urls: string[];
  /** Stopped adding images so total JSON stays under budget */
  stoppedEarlyDueToPayloadBudget: boolean;
};

/**
 * ORDER SYBNB-83 — Sequential compression + rolling JSON char budget (one pass ≈ one upload chunk mentally).
 */
export async function compressListingImagesForQuickPost(
  files: File[],
  maxCount = MAX_LISTING_IMAGES,
): Promise<CompressListingImagesResult> {
  const cap = Math.max(0, Math.min(maxCount, MAX_LISTING_IMAGES));
  const list = Array.from(files)
    .filter((f) => f.type.startsWith("image/") && f.size <= MAX_IMAGE_FILE_BYTES)
    .slice(0, cap);

  const urls: string[] = [];
  let totalChars = 0;
  let stoppedEarlyDueToPayloadBudget = false;

  for (const file of list) {
    let dataUrl: string;
    try {
      dataUrl = await compressImageFileToDataUrl(file);
    } catch {
      continue;
    }
    if (!dataUrl || dataUrl.length === 0) continue;

    if (totalChars + dataUrl.length > MAX_LISTING_IMAGES_JSON_CHARS_BUDGET) {
      stoppedEarlyDueToPayloadBudget = true;
      break;
    }
    urls.push(dataUrl);
    totalChars += dataUrl.length;
  }

  return { urls, stoppedEarlyDueToPayloadBudget };
}

/** SYBNB-90 — Single POST with all images; on CDN misconfig fall back to legacy compression (dev); on upload error allow listing without photos. */
export async function prepareListingImagesForQuickPost(
  files: File[],
  maxCount = MAX_LISTING_IMAGES,
): Promise<CompressListingImagesResult & { mode: "cdn" | "legacy" }> {
  const cap = Math.max(0, Math.min(maxCount, MAX_LISTING_IMAGES));
  const list = Array.from(files)
    .filter((f) => f.type.startsWith("image/") && f.size <= MAX_IMAGE_FILE_BYTES)
    .slice(0, cap);

  if (list.length === 0) {
    return { urls: [], stoppedEarlyDueToPayloadBudget: false, mode: "cdn" };
  }

  const fd = new FormData();
  for (const file of list) {
    fd.append("file", file);
  }

  const res = await fetch("/api/listings/images", { method: "POST", body: fd });
  const data = (await res.json().catch(() => ({}))) as {
    ok?: boolean;
    urls?: string[];
    secure_urls?: string[];
    error?: string;
  };

  const urlsFromBody = Array.isArray(data.urls) ? data.urls : Array.isArray(data.secure_urls) ? data.secure_urls : [];

  if (res.ok && data.ok === true && urlsFromBody.length === list.length) {
    return { urls: urlsFromBody, stoppedEarlyDueToPayloadBudget: false, mode: "cdn" };
  }

  if (res.status === 503 && data.error === "cdn_unconfigured") {
    const legacy = await compressListingImagesForQuickPost(list, cap);
    return { ...legacy, mode: "legacy" };
  }

  /** Upload failed but user may submit without photos (SYBNB-90). */
  return { urls: [], stoppedEarlyDueToPayloadBudget: false, mode: "cdn" };
}

/** @deprecated Prefer `prepareListingImagesForQuickPost` (SYBNB-87). */
export async function readListingImageFilesForUpload(files: File[], maxCount = MAX_LISTING_IMAGES): Promise<string[]> {
  const { urls } = await compressListingImagesForQuickPost(files, maxCount);
  return urls;
}

/** @deprecated Prefer `compressListingImagesForQuickPost` */
export async function processListingImageFiles(files: File[], maxCount = MAX_LISTING_IMAGES): Promise<string[]> {
  return readListingImageFilesForUpload(files, maxCount);
}
