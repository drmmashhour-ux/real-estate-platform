/**
 * Client-only helpers for quick-post listing images (base64 data URLs, no S3 in MVP).
 */

export const MAX_LISTING_IMAGES = 5;
export const MAX_IMAGE_FILE_BYTES = 2.5 * 1024 * 1024;
export const MAX_IMAGE_WIDTH = 1600;
export const JPEG_QUALITY = 0.82;

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result ?? ""));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

/**
 * Resizes to max width, outputs JPEG. Falls back to raw data URL on failure.
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
    const w0 = bitmap.width;
    const h0 = bitmap.height;
    if (w0 <= 0 || h0 <= 0) {
      return readFileAsDataUrl(file);
    }
    const scale = Math.min(1, MAX_IMAGE_WIDTH / Math.max(w0, h0));
    const w = Math.max(1, Math.round(w0 * scale));
    const h = Math.max(1, Math.round(h0 * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return readFileAsDataUrl(file);
    }
    ctx.drawImage(bitmap, 0, 0, w, h);
    return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
  } finally {
    bitmap.close();
  }
}

/**
 * Up to `maxCount` images (capped at `MAX_LISTING_IMAGES`), skips invalid types, compresses in order.
 */
export async function processListingImageFiles(files: File[], maxCount = MAX_LISTING_IMAGES): Promise<string[]> {
  const cap = Math.max(0, Math.min(maxCount, MAX_LISTING_IMAGES));
  const out: string[] = [];
  const list = files.filter((f) => f.type.startsWith("image/") && f.size <= MAX_IMAGE_FILE_BYTES);
  for (const file of list.slice(0, cap)) {
    try {
      out.push(await compressImageFileToDataUrl(file));
    } catch {
      // skip
    }
  }
  return out;
}
