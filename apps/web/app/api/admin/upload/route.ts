import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { loadStayListingForEditor } from "@/lib/admin/stay-listing-edit";
import { uploadStayListingImagePublicUrl } from "@/lib/bnhub/upload-listing-media-public";

export const dynamic = "force-dynamic";

/**
 * POST multipart: listingId + one or more `file` fields (or repeated file parts).
 * Returns { urls: string[] } for attaching via PUT /api/admin/listings/:id/photos.
 */
export async function POST(req: NextRequest) {
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return Response.json({ error: "Expected multipart form data" }, { status: 400 });
  }

  const listingId = typeof form.get("listingId") === "string" ? (form.get("listingId") as string).trim() : "";
  if (!listingId) return Response.json({ error: "listingId is required" }, { status: 400 });

  const { row, forbidden } = await loadStayListingForEditor(listingId, userId);
  if (forbidden) return Response.json({ error: "Forbidden" }, { status: 403 });
  if (!row) return Response.json({ error: "Listing not found" }, { status: 404 });

  const files = form.getAll("file").filter((f): f is File => f instanceof File && f.size > 0);
  if (!files.length) return Response.json({ error: "At least one file is required" }, { status: 400 });

  const urls: string[] = [];
  const errors: string[] = [];
  let allFailedStatus = 400;
  for (const file of files) {
    const contentType = file.type || "image/jpeg";
    const buf = Buffer.from(await file.arrayBuffer());
    const r = await uploadStayListingImagePublicUrl({ listingId, bytes: buf, contentType });
    if ("error" in r) {
      errors.push(r.error);
      if (errors.length === 1 && r.status) allFailedStatus = r.status;
    } else {
      urls.push(r.url);
    }
  }

  if (!urls.length) {
    return Response.json({ error: errors[0] ?? "Upload failed", errors }, { status: allFailedStatus });
  }
  return Response.json({ urls, errors: errors.length ? errors : undefined });
}
