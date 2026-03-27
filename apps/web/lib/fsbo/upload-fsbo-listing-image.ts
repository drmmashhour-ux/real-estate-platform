import { mkdir, writeFile } from "fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import {
  FSBO_ALLOWED_IMAGE_MIME,
  FSBO_IMAGE_EXTENSION_BY_MIME,
  FSBO_STORAGE_FOLDER_SEGMENT,
} from "@/lib/fsbo/media-config";

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

/**
 * Upload a single validated image buffer. Returns a URL suitable to store in `FsboListing.images`.
 * Supabase: when `SUPABASE_SERVICE_ROLE_KEY` is set (server-only), uses Storage; else writes under `public/uploads/fsbo/{listingId}/`.
 */
export async function uploadFsboListingImage(params: {
  listingId: string;
  buffer: Buffer;
  contentType: string;
}): Promise<{ url: string }> {
  const { listingId, buffer, contentType } = params;
  if (!FSBO_ALLOWED_IMAGE_MIME.has(contentType)) {
    throw new Error("Unsupported image type");
  }
  const ext = FSBO_IMAGE_EXTENSION_BY_MIME[contentType];
  if (!ext) throw new Error("Unsupported image type");

  const objectName = `${randomUUID()}.${ext}`;
  const relativePath = `${FSBO_STORAGE_FOLDER_SEGMENT}/${listingId}/${objectName}`;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (supabaseUrl && serviceKey) {
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const bucket = getBucketName();
    const { error } = await admin.storage.from(bucket).upload(relativePath, buffer, {
      contentType,
      upsert: false,
    });
    if (error) {
      throw new Error(error.message || "Storage upload failed");
    }
    const { data } = admin.storage.from(bucket).getPublicUrl(relativePath);
    if (!data?.publicUrl) {
      throw new Error("Could not build public URL for upload");
    }
    return { url: data.publicUrl };
  }

  const dir = path.join(process.cwd(), "public", "uploads", FSBO_STORAGE_FOLDER_SEGMENT, listingId);
  await mkdir(dir, { recursive: true });
  const diskPath = path.join(dir, objectName);
  await writeFile(diskPath, buffer);

  const origin = appPublicOrigin();
  const publicPath = `/uploads/${FSBO_STORAGE_FOLDER_SEGMENT}/${listingId}/${objectName}`;
  return { url: origin ? `${origin}${publicPath}` : publicPath };
}
