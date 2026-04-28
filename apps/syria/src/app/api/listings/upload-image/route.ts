import { NextResponse } from "next/server";
import { assertDarlinkRuntimeEnv } from "@/lib/guard";
import { uploadListingImageBuffer, isCloudinaryConfigured } from "@/lib/syria/cloudinary-server";
import { MAX_IMAGE_FILE_BYTES } from "@/lib/syria/photo-upload";

export const runtime = "nodejs";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

/** ORDER SYBNB-87 — Single-file upload (same pipeline as `POST /api/listings/images`). */
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

  const file = form.get("file");
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ ok: false, error: "missing_file" }, { status: 400 });
  }

  const type = file.type || "application/octet-stream";
  if (!ALLOWED.has(type)) {
    return NextResponse.json({ ok: false, error: "unsupported_type" }, { status: 400 });
  }

  if (file.size > MAX_IMAGE_FILE_BYTES) {
    return NextResponse.json({ ok: false, error: "file_too_large" }, { status: 413 });
  }

  const buf = Buffer.from(await file.arrayBuffer());

  try {
    const url = await uploadListingImageBuffer(buf);
    return NextResponse.json({ ok: true, url });
  } catch {
    return NextResponse.json({ ok: false, error: "upload_failed" }, { status: 502 });
  }
}
