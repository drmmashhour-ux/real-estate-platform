import { mkdir, writeFile } from "fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { scanBufferBeforeStorage } from "@/lib/security/malware-scan";
import { INTAKE_MAX_FILES, INTAKE_MAX_PHOTOS } from "@/lib/listing-acquisition/intake-limits";

const SEGMENT = "listing-acquisition";

export { INTAKE_MAX_FILES, INTAKE_MAX_PHOTOS };

const PHOTO_MIME = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);
const DOC_MIME = new Set([
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

const EXT: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export const INTAKE_MAX_BYTES = 12 * 1024 * 1024;

function appPublicOrigin(): string {
  const o = process.env.NEXT_PUBLIC_APP_ORIGIN?.replace(/\/$/, "");
  if (o) return o;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL.replace(/^https?:\/\//, "")}`;
  return "";
}

function toPublicUrl(relativePath: string): string {
  const origin = appPublicOrigin();
  return origin ? `${origin}${relativePath}` : relativePath;
}

async function saveOne(params: {
  leadId: string;
  buffer: Buffer;
  contentType: string;
  context: string;
}): Promise<string> {
  const { leadId, buffer, contentType } = params;
  if (buffer.length === 0) throw new Error("Empty file");
  if (buffer.length > INTAKE_MAX_BYTES) throw new Error("File too large (max 12MB)");

  const scan = await scanBufferBeforeStorage({
    bytes: buffer,
    mimeType: contentType,
    context: params.context,
  });
  if (!scan.ok) {
    throw new Error(scan.userMessage);
  }

  const ext = EXT[contentType];
  if (!ext) throw new Error("Unsupported file type");
  const objectName = `${randomUUID()}.${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads", SEGMENT, leadId);
  await mkdir(dir, { recursive: true });
  const diskPath = path.join(dir, objectName);
  await writeFile(diskPath, buffer);
  const relativePath = `/uploads/${SEGMENT}/${leadId}/${objectName}`;
  return toPublicUrl(relativePath);
}

export async function storeListingAcquisitionIdentityFile(params: {
  leadId: string;
  buffer: Buffer;
  contentType: string;
}): Promise<string> {
  if (!DOC_MIME.has(params.contentType)) {
    throw new Error("ID must be PDF or JPG/PNG/WebP");
  }
  return saveOne({
    leadId: params.leadId,
    buffer: params.buffer,
    contentType: params.contentType,
    context: "listing_acquisition_identity",
  });
}

export async function storeListingAcquisitionPhoto(params: {
  leadId: string;
  buffer: Buffer;
  contentType: string;
}): Promise<string> {
  if (!PHOTO_MIME.has(params.contentType)) {
    throw new Error("Photos must be JPG, PNG, or WebP");
  }
  return saveOne({
    leadId: params.leadId,
    buffer: params.buffer,
    contentType: params.contentType,
    context: "listing_acquisition_photo",
  });
}

export async function storeListingAcquisitionDocument(params: {
  leadId: string;
  buffer: Buffer;
  contentType: string;
}): Promise<string> {
  if (!DOC_MIME.has(params.contentType)) {
    throw new Error("Documents must be PDF or JPG/PNG/WebP");
  }
  return saveOne({
    leadId: params.leadId,
    buffer: params.buffer,
    contentType: params.contentType,
    context: "listing_acquisition_doc",
  });
}
