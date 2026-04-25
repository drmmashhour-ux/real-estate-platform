import { NextRequest } from "next/server";
import { uploadListingImageAndAttach } from "@/lib/bnhub/listingMediaUpload";

function authorized(req: NextRequest): boolean {
  const secret = process.env.BNHUB_LISTING_MEDIA_UPLOAD_SECRET?.trim();
  if (!secret) return false;
  const auth = req.headers.get("authorization") ?? "";
  const m = auth.match(/^Bearer\s+(.+)$/i);
  return Boolean(m?.[1] && m[1] === secret);
}

/**
 * POST multipart: fields `file` (binary), `listingId` (uuid).
 * Header: `Authorization: Bearer <BNHUB_LISTING_MEDIA_UPLOAD_SECRET>` (server-side / ops only).
 */
export async function POST(req: NextRequest) {
  if (!process.env.BNHUB_LISTING_MEDIA_UPLOAD_SECRET?.trim()) {
    return Response.json(
      { error: "Listing media upload is not configured (set BNHUB_LISTING_MEDIA_UPLOAD_SECRET)." },
      { status: 503 }
    );
  }
  if (!authorized(req)) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return Response.json({ error: "Expected multipart form data." }, { status: 400 });
  }

  const listingId = typeof form.get("listingId") === "string" ? (form.get("listingId") as string).trim() : "";
  const file = form.get("file");
  if (!listingId) {
    return Response.json({ error: "listingId is required." }, { status: 400 });
  }
  if (!file || !(file instanceof Blob)) {
    return Response.json({ error: "file is required." }, { status: 400 });
  }

  const contentType = file.type || "image/jpeg";
  const buf = Buffer.from(await file.arrayBuffer());

  const result = await uploadListingImageAndAttach({ listingId, bytes: buf, contentType });
  if ("error" in result) {
    return Response.json({ error: result.error }, { status: result.status ?? 400 });
  }

  return Response.json({ url: result.url, imageId: result.imageId, listingId });
}

export const dynamic = "force-dynamic";
