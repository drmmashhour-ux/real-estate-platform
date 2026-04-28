import { NextResponse } from "next/server";
import { assertDarlinkRuntimeEnv } from "@/lib/guard";
import { getSessionUser } from "@/lib/auth";
import { isCloudinaryConfigured, uploadListingProofDocumentBuffer } from "@/lib/syria/cloudinary-server";

export const runtime = "nodejs";

const MAX_BYTES = 8 * 1024 * 1024;

/** ORDER SYBNB-100 — Authenticated upload of deed/proof files (same CDN folder tier as listing photos). */
export async function POST(req: Request) {
  try {
    assertDarlinkRuntimeEnv();
  } catch {
    return NextResponse.json({ ok: false, error: "unavailable" }, { status: 503 });
  }

  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "auth_required" }, { status: 401 });
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

  const type = (file.type || "application/octet-stream").trim().toLowerCase();

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ ok: false, error: "file_too_large" }, { status: 413 });
  }

  const buf = Buffer.from(await file.arrayBuffer());

  try {
    const url = await uploadListingProofDocumentBuffer(buf, type);
    return NextResponse.json({ ok: true, url });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "proof_unsupported_mime") {
      return NextResponse.json({ ok: false, error: "unsupported_type" }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: "upload_failed" }, { status: 502 });
  }
}
