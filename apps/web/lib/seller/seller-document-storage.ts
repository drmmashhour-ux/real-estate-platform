import { mkdir, unlink, writeFile } from "fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

/** Max 10MB per file (product requirement). */
export const SELLER_DOC_MAX_BYTES = 10 * 1024 * 1024;

const MIME_TO_EXT: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "text/csv": "csv",
  "text/plain": "txt",
};

export const SELLER_DOC_ALLOWED_MIME = new Set(Object.keys(MIME_TO_EXT));

export function sellerDocExtension(contentType: string): string | null {
  return MIME_TO_EXT[contentType] ?? null;
}

function bucketName(): string {
  return process.env.SELLER_DOCUMENTS_SUPABASE_BUCKET?.trim() || "seller-documents";
}

function supabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!supabaseUrl || !serviceKey) return null;
  return createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Upload to private bucket `seller-documents` at `userId/fsboListingId/uuid.ext`.
 * Returns storage key (same as path in bucket). No public URL — use signed URLs for access.
 */
export async function uploadSellerDocumentToStorage(params: {
  userId: string;
  fsboListingId: string;
  buffer: Buffer;
  contentType: string;
}): Promise<{ storagePath: string; storedFileName: string }> {
  const { userId, fsboListingId, buffer, contentType } = params;
  if (buffer.length > SELLER_DOC_MAX_BYTES) {
    throw new Error(`File too large (max ${SELLER_DOC_MAX_BYTES / (1024 * 1024)}MB)`);
  }
  if (!SELLER_DOC_ALLOWED_MIME.has(contentType)) {
    throw new Error("File type not allowed");
  }
  const ext = sellerDocExtension(contentType);
  if (!ext) throw new Error("Unsupported file type");

  const storedFileName = `${randomUUID()}.${ext}`;
  const storagePath = `${userId}/${fsboListingId}/${storedFileName}`;

  const admin = supabaseAdmin();
  if (admin) {
    const bucket = bucketName();
    const { error } = await admin.storage.from(bucket).upload(storagePath, buffer, {
      contentType,
      upsert: false,
    });
    if (error) {
      throw new Error(error.message || "Storage upload failed");
    }
    return { storagePath, storedFileName };
  }

  const relative = path.join("seller-documents", userId, fsboListingId, storedFileName);
  const dir = path.join(process.cwd(), "private", "uploads", "seller-documents", userId, fsboListingId);
  await mkdir(dir, { recursive: true });
  const diskPath = path.join(dir, storedFileName);
  await writeFile(diskPath, buffer);
  return { storagePath: `local:${relative}`, storedFileName };
}

export async function deleteSellerDocumentFromStorage(storagePath: string): Promise<void> {
  if (storagePath.startsWith("local:")) {
    const rel = storagePath.slice("local:".length);
    const diskPath = path.join(process.cwd(), "private", "uploads", rel);
    try {
      await unlink(diskPath);
    } catch {
      /* ignore */
    }
    return;
  }

  const admin = supabaseAdmin();
  if (!admin) return;
  const bucket = bucketName();
  await admin.storage.from(bucket).remove([storagePath]);
}

/**
 * Signed URL for private object (short-lived). Returns null if cannot sign (e.g. local without supabase).
 * Pass `download` to trigger attachment download with optional filename.
 */
export async function createSellerDocumentSignedUrl(
  storagePath: string,
  expiresInSeconds = 120,
  options?: { download?: string | boolean }
): Promise<string | null> {
  if (storagePath.startsWith("local:")) {
    return null;
  }
  const admin = supabaseAdmin();
  if (!admin) return null;
  const bucket = bucketName();
  const { data, error } = await admin.storage.from(bucket).createSignedUrl(storagePath, expiresInSeconds, {
    download: options?.download,
  });
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

/** Read local fallback file into buffer (for API route streaming download). */
export function localSellerDocumentAbsolutePath(storagePath: string): string | null {
  if (!storagePath.startsWith("local:")) return null;
  const rel = storagePath.slice("local:".length);
  return path.join(process.cwd(), "private", "uploads", rel);
}
