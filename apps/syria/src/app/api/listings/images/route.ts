import { NextResponse } from "next/server";
import { assertDarlinkRuntimeEnv } from "@/lib/guard";
import { isCloudinaryConfigured, uploadListingImageBuffersBatch } from "@/lib/syria/cloudinary-server";
import { MAX_IMAGE_FILE_BYTES, MAX_LISTING_IMAGES } from "@/lib/syria/photo-upload";

export const runtime = "nodejs";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

/** ORDER SYBNB-90 — Batch multipart upload (≤5 images); returns HTTPS Cloudinary delivery URLs. */

export async function POST(req: Request) {
  try {
    assertDarlinkRuntimeEnv();
  } catch {
    return NextResponse.json({ ok: false, error: "unavailable" }, { status: 503 });
  }

  if (!isCloudinaryConfigured()) {
    return NextResponse.json({ ok: false, error: "cdn_unconfigured" }, { status: 503 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const files: File[] = [];
  for (const [key, value] of form.entries()) {
    if (!(value instanceof File) || value.size <= 0) continue;
    if (key === "file" || key === "files" || key === "files[]" || key === "images" || key === "images[]") {
      files.push(value);
    }
  }

  if (files.length === 0) {
    return NextResponse.json({ ok: false, error: "missing_files" }, { status: 400 });
  }
  if (files.length > MAX_LISTING_IMAGES) {
    return NextResponse.json({ ok: false, error: "too_many_files" }, { status: 400 });
  }

  const buffers: Buffer[] = [];
  for (const file of files) {
    const type = file.type || "application/octet-stream";
    if (!ALLOWED.has(type)) {
      return NextResponse.json({ ok: false, error: "unsupported_type" }, { status: 400 });
    }
    if (file.size > MAX_IMAGE_FILE_BYTES) {
      return NextResponse.json({ ok: false, error: "file_too_large" }, { status: 413 });
    }
    buffers.push(Buffer.from(await file.arrayBuffer()));
  }

  try {
    const urls = await uploadListingImageBuffersBatch(buffers);
    /** Primary payload — stable CDN HTTPS URLs (delivery transformations baked in). */
    return NextResponse.json({ ok: true, urls, secure_urls: urls });
  } catch {
    return NextResponse.json({ ok: false, error: "upload_failed" }, { status: 502 });
  }
}
