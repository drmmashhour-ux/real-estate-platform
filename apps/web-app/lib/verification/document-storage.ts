/**
 * Secure storage for property verification documents (land register extract, broker authorization).
 * PDF only. In production, replace with S3 or similar and use signed URLs.
 */

import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const PDF_MIME = "application/pdf";
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

// Store under public so files are served; in production use env for bucket or path
const UPLOAD_DIR =
  process.env.PROPERTY_DOCUMENTS_UPLOAD_DIR ||
  path.join(process.cwd(), "public", "uploads", "property-documents");

export type SaveDocumentResult =
  | { ok: true; relativeUrl: string; filename: string }
  | { ok: false; error: string };

/**
 * Validate file is PDF and within size limit, then save to disk.
 * Returns a URL path like /uploads/property-documents/{listingId}/{uuid}.pdf
 */
export async function savePropertyDocument(params: {
  listingId: string;
  buffer: Buffer;
  mimeType: string;
  originalFilename?: string;
}): Promise<SaveDocumentResult> {
  if (params.mimeType !== PDF_MIME) {
    return { ok: false, error: "Only PDF files are accepted" };
  }
  if (params.buffer.length > MAX_SIZE_BYTES) {
    return { ok: false, error: `File must be under ${MAX_SIZE_BYTES / 1024 / 1024} MB` };
  }
  if (params.buffer.length === 0) {
    return { ok: false, error: "File is empty" };
  }

  const dir = path.join(UPLOAD_DIR, params.listingId);
  await mkdir(dir, { recursive: true });
  const ext = path.extname(params.originalFilename || "").toLowerCase() || ".pdf";
  const filename = `${randomUUID()}${ext === ".pdf" ? ".pdf" : ".pdf"}`;
  const filePath = path.join(dir, filename);
  await writeFile(filePath, params.buffer, "binary");

  // URL path for browser (relative to app origin)
  const relativeUrl = `/uploads/property-documents/${params.listingId}/${filename}`;
  return { ok: true, relativeUrl, filename };
}

const IMAGE_MIMES = ["image/jpeg", "image/png", "image/webp"];
const IDENTITY_UPLOAD_DIR =
  process.env.IDENTITY_DOCUMENTS_UPLOAD_DIR ||
  path.join(process.cwd(), "public", "uploads", "identity-documents");
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Save identity or broker document (PDF or image). Used for gov ID and selfie.
 */
export async function saveVerificationImage(params: {
  userId: string;
  kind: "government_id" | "selfie" | "broker_doc";
  buffer: Buffer;
  mimeType: string;
  originalFilename?: string;
}): Promise<SaveDocumentResult> {
  const allowed = [...IMAGE_MIMES, PDF_MIME];
  if (!allowed.includes(params.mimeType)) {
    return { ok: false, error: "Only PDF or image (JPEG, PNG, WebP) are accepted" };
  }
  if (params.buffer.length > MAX_IMAGE_BYTES) {
    return { ok: false, error: `File must be under ${MAX_IMAGE_BYTES / 1024 / 1024} MB` };
  }
  if (params.buffer.length === 0) {
    return { ok: false, error: "File is empty" };
  }

  const dir = path.join(IDENTITY_UPLOAD_DIR, params.userId);
  await mkdir(dir, { recursive: true });
  const ext = path.extname(params.originalFilename || "").toLowerCase() || (params.mimeType === PDF_MIME ? ".pdf" : ".jpg");
  const filename = `${params.kind}-${randomUUID()}${ext}`;
  const filePath = path.join(dir, filename);
  await writeFile(filePath, params.buffer, "binary");

  const relativeUrl = `/uploads/identity-documents/${params.userId}/${filename}`;
  return { ok: true, relativeUrl, filename };
}
