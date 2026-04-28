/**
 * ORDER SYBNB-80 — JPEG normalization for legacy data URLs.
 * ORDER SYBNB-87 — HTTPS CDN URLs pass through unchanged (Cloudinary delivery URLs).
 */
import sharp from "sharp";
import { MAX_IMAGE_WIDTH } from "@/lib/syria/photo-upload";

const JPEG_QUALITY = 68;

/** SYBNB-87 — Prefer persisted HTTPS CDN URLs; legacy data URLs normalized with sharp; remote http(s) URLs pass through. */
export async function normalizeListingImagesForPersist(urls: string[]): Promise<string[]> {
  const remoteUrls: string[] = [];
  const dataUrls: string[] = [];
  for (const u of urls) {
    const t = typeof u === "string" ? u.trim() : "";
    if (!t) continue;
    if (/^https?:\/\//i.test(t)) {
      remoteUrls.push(t);
      continue;
    }
    if (t.startsWith("data:image")) {
      dataUrls.push(t);
      continue;
    }
  }
  if (dataUrls.length === 0) return remoteUrls;
  const normalized = await compressListingImageDataUrlsForPersist(dataUrls);
  return [...remoteUrls, ...normalized];
}

/** Compress listing photo data URLs; passes HTTPS URLs through unchanged. */
export async function compressListingImageDataUrlsForPersist(urls: string[]): Promise<string[]> {
  const out: string[] = [];
  for (const u of urls) {
    if (!u.startsWith("data:image")) {
      out.push(u);
      continue;
    }
    try {
      const comma = u.indexOf(",");
      if (comma < 0) {
        out.push(u);
        continue;
      }
      const meta = u.slice(0, comma);
      const payload = u.slice(comma + 1);
      const buf = meta.endsWith(";base64") ? Buffer.from(payload, "base64") : Buffer.from(decodeURIComponent(payload), "utf8");

      const jpeg = await sharp(buf).rotate().resize(MAX_IMAGE_WIDTH, MAX_IMAGE_WIDTH, { fit: "inside", withoutEnlargement: true }).jpeg({ quality: JPEG_QUALITY }).toBuffer();

      out.push(`data:image/jpeg;base64,${jpeg.toString("base64")}`);
    } catch {
      out.push(u);
    }
  }
  return out;
}
