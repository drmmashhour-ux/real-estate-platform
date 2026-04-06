import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { uploadStayListingImagePublicUrl } from "@/lib/bnhub/upload-listing-media-public";
import { setListingPhotos } from "@/lib/bnhub/listings";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** POST multipart: field `file` (image). Appends to ordered photos; first upload can be cover. */
export async function POST(req: NextRequest, ctx: Ctx) {
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id: listingId } = await ctx.params;
  const listing = await prisma.shortTermListing.findUnique({ where: { id: listingId } });
  if (!listing) return Response.json({ error: "Not found" }, { status: 404 });
  if (listing.ownerId !== userId) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return Response.json({ error: "Expected multipart form data" }, { status: 400 });
  }

  const file = form.get("file");
  if (!file || !(file instanceof Blob)) {
    return Response.json({ error: "file is required" }, { status: 400 });
  }

  const contentType = file.type || "image/jpeg";
  const buf = Buffer.from(await file.arrayBuffer());
  const up = await uploadStayListingImagePublicUrl({ listingId, bytes: buf, contentType });
  if ("error" in up) return Response.json({ error: up.error }, { status: 400 });

  const existing = await prisma.bnhubListingPhoto.findMany({
    where: { listingId },
    orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }],
  });

  const photos = existing.map((p) => ({
    url: p.url,
    sortOrder: p.sortOrder,
    isCover: p.isCover,
  }));
  const nextOrder = photos.length ? Math.max(...photos.map((p) => p.sortOrder)) + 1 : 0;
  photos.push({ url: up.url, sortOrder: nextOrder, isCover: photos.length === 0 });

  const rows = await setListingPhotos(listingId, photos);
  return Response.json({ url: up.url, photos: rows });
}
