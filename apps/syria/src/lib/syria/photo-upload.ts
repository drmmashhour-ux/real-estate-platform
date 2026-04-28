/**
 * Client-only helpers for quick-post listing images (base64 data URLs).
 * SYBNB-66: JPEG output, ~200–300KB target per image; at scale prefer object storage (S3/R2/Cloudinary) over huge DB strings.
 */

export const MAX_LISTING_IMAGES = 5;
/** Input file cap before client compression (generous; compressed output is capped separately). */
export const MAX_IMAGE_FILE_BYTES = 2.5 * 1024 * 1024;
export const MAX_IMAGE_WIDTH = 1600;
/** Output budget after JPEG recompression (middle of 200–300KB band). */
export const TARGET_JPEG_MAX_BYTES = 280 * 1024;
export const JPEG_QUALITY_DEFAULT = 0.78;
/** @deprecated Use JPEG_QUALITY_DEFAULT — kept for callers importing JPEG_QUALITY */
export const JPEG_QUALITY = JPEG_QUALITY_DEFAULT;
const JPEG_QUALITY_MIN = 0.42;

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
 * Resize + iterative JPEG quality / optional extra downscale until under TARGET_JPEG_MAX_BYTES.
 */
async function bitmapToJpegDataUrlUnderBudget(bitmap: ImageBitmap): Promise<string> {
  let scale = Math.min(1, MAX_IMAGE_WIDTH / Math.max(bitmap.width, bitmap.height));

  for (let pass = 0; pass < 5; pass++) {
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
      q -= 0.065;
    }
    scale *= 0.86;
  }

  return bitmapToLossyDataUrlMinimal(bitmap);
}

function bitmapToLossyDataUrlMinimal(bitmap: ImageBitmap): string {
  const w = Math.max(1, Math.round(bitmap.width * 0.25));
  const h = Math.max(1, Math.round(bitmap.height * 0.25));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  ctx.drawImage(bitmap, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", JPEG_QUALITY_MIN);
}

/**
 * Resizes to max width, outputs JPEG under TARGET_JPEG_MAX_BYTES. Falls back to raw data URL only when canvas APIs fail.
 */
export async function compressImageFileToDataUrl(file: File): Promise<string> {
  if (typeof createImageBitmap === "undefined") {
    return readFileAsDataUrl(file);
  }
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return readFileAsDataUrl(file);
  }
  try {
    if (bitmap.width <= 0 || bitmap.height <= 0) {
      return readFileAsDataUrl(file);
    }
    return await bitmapToJpegDataUrlUnderBudget(bitmap);
  } finally {
    bitmap.close();
  }
}

/**
 * Up to `maxCount` images (capped at `MAX_LISTING_IMAGES`), skips invalid types, JPEG-compressed data URLs.
 */
export async function processListingImageFiles(files: File[], maxCount = MAX_LISTING_IMAGES): Promise<string[]> {
  const cap = Math.max(0, Math.min(maxCount, MAX_LISTING_IMAGES));
  const list = Array.from(files)
    .filter((f) => f.type.startsWith("image/") && f.size <= MAX_IMAGE_FILE_BYTES)
    .slice(0, cap);
  const out: string[] = [];
  for (const file of list) {
    try {
      const url = await compressImageFileToDataUrl(file);
      if (url.length > 0) out.push(url);
    } catch {
      // skip
    }
  }
  return out;
}
