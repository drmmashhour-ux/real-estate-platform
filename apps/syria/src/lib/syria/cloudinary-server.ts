/**
 * ORDER SYBNB-87 / SYBNB-90 — Cloudinary uploads + delivery URLs (`w_800`, `c_limit`, `q_auto`, `f_auto`).
 */
import type { UploadApiResponse } from "cloudinary";
import { cloudinary } from "@/lib/cloudinary";

export function isCloudinaryConfigured(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME?.trim() &&
      process.env.CLOUDINARY_API_KEY?.trim() &&
      process.env.CLOUDINARY_API_SECRET?.trim(),
  );
}

/** ORDER SYBNB-103 — isolated from Canada uploads; proofs live under `{folder}/proofs`. */
export const SYRIA_CLOUDINARY_LISTINGS_FOLDER_DEFAULT = "sybnb/syria";

function listingsFolder(): string {
  return process.env.CLOUDINARY_LISTINGS_FOLDER?.trim() || SYRIA_CLOUDINARY_LISTINGS_FOLDER_DEFAULT;
}

const DELIVERY_TRANSFORMATION = [
  { width: 800, crop: "limit" as const },
  { quality: "auto" as const, fetch_format: "auto" as const },
] as const;

function deliveryUrlFromUpload(result: UploadApiResponse): string {
  return cloudinary.url(result.public_id, {
    secure: true,
    ...(result.version != null ? { version: result.version } : {}),
    transformation: [...DELIVERY_TRANSFORMATION],
  });
}

export async function uploadListingImageBuffer(buffer: Buffer): Promise<string> {
  if (!isCloudinaryConfigured()) {
    throw new Error("CLOUDINARY_NOT_CONFIGURED");
  }
  const folder = listingsFolder();

  const result = await new Promise<UploadApiResponse>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder, resource_type: "image" }, (err, res) => {
      if (err) reject(err);
      else if (!res) reject(new Error("cloudinary_upload_empty"));
      else resolve(res);
    });
    stream.end(buffer);
  });

  return deliveryUrlFromUpload(result);
}

/** ORDER SYBNB-90 — Upload many buffers in order; throws on first failure (caller returns 502). */
export async function uploadListingImageBuffersBatch(buffers: Buffer[]): Promise<string[]> {
  const out: string[] = [];
  for (const buf of buffers) {
    out.push(await uploadListingImageBuffer(buf));
  }
  return out;
}

const PROOF_MIME_ALLOW = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "application/x-pdf",
]);

/** ORDER SYBNB-100 — proofs (images or PDF) under `…/proofs`; returns HTTPS secure URL (stored privately). */
export async function uploadListingProofDocumentBuffer(buffer: Buffer, mime: string): Promise<string> {
  if (!isCloudinaryConfigured()) {
    throw new Error("CLOUDINARY_NOT_CONFIGURED");
  }
  const m = (mime ?? "").trim().toLowerCase();
  if (!PROOF_MIME_ALLOW.has(m)) {
    throw new Error("proof_unsupported_mime");
  }
  const folder = `${listingsFolder()}/proofs`;
  const resource_type = m === "application/pdf" || m === "application/x-pdf" ? "raw" : "image";

  const result = await new Promise<UploadApiResponse>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder, resource_type }, (err, res) => {
      if (err) reject(err);
      else if (!res) reject(new Error("cloudinary_upload_empty"));
      else resolve(res);
    });
    stream.end(buffer);
  });

  const secure = result.secure_url?.trim();
  if (!secure) throw new Error("cloudinary_upload_empty");
  return secure;
}
