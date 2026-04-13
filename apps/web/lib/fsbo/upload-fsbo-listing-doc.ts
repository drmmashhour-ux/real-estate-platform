import { mkdir, writeFile } from "fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { FSBO_STORAGE_FOLDER_SEGMENT } from "@/lib/fsbo/media-config";
import { scanBufferBeforeStorage } from "@/lib/security/malware-scan";

export const FSBO_DOC_MAX_BYTES = 12 * 1024 * 1024;

export const FSBO_ALLOWED_DOC_MIME = new Set(["application/pdf", "image/jpeg", "image/jpg", "image/png", "image/webp"]);

const EXT: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function getBucketName(): string {
  return process.env.FSBO_SUPABASE_BUCKET?.trim() || "fsbo-media";
}

function appPublicOrigin(): string {
  const o = process.env.NEXT_PUBLIC_APP_ORIGIN?.replace(/\/$/, "");
  if (o) return o;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL.replace(/^https?:\/\//, "")}`;
  return "";
}

/**
 * Upload a PDF or image for Seller Hub document slots. Returns public URL.
 */
export async function uploadFsboListingDoc(params: {
  listingId: string;
  buffer: Buffer;
  contentType: string;
  originalName?: string;
  /** Subfolder under listing (default `docs`). Use `party-id/{partyId}` for party ID uploads. */
  folder?: string;
}): Promise<{ url: string; fileName: string }> {
  const { listingId, buffer, contentType } = params;
  const folder = (params.folder ?? "docs").replace(/^\/+|\/+$/g, "");
  if (buffer.length > FSBO_DOC_MAX_BYTES) {
    throw new Error("File too large (max 12MB)");
  }
  if (!FSBO_ALLOWED_DOC_MIME.has(contentType)) {
    throw new Error("Only PDF or JPG/PNG/WebP allowed");
  }
  const ext = EXT[contentType];
  if (!ext) throw new Error("Unsupported file type");

  const scan = await scanBufferBeforeStorage({
    bytes: buffer,
    mimeType: contentType,
    context: "fsbo_listing_doc",
  });
  if (!scan.ok) {
    throw new Error(scan.userMessage);
  }

  const objectName = `${randomUUID()}.${ext}`;
  const relativePath = `${FSBO_STORAGE_FOLDER_SEGMENT}/${listingId}/${folder}/${objectName}`;

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
    return { url: data.publicUrl, fileName: objectName };
  }

  const dir = path.join(process.cwd(), "public", "uploads", FSBO_STORAGE_FOLDER_SEGMENT, listingId, ...folder.split("/"));
  await mkdir(dir, { recursive: true });
  const diskPath = path.join(dir, objectName);
  await writeFile(diskPath, buffer);

  const origin = appPublicOrigin();
  const publicPath = `/uploads/${FSBO_STORAGE_FOLDER_SEGMENT}/${listingId}/${folder.replace(/\/+/g, "/")}/${objectName}`;
  return { url: origin ? `${origin}${publicPath}` : publicPath, fileName: objectName };
}
