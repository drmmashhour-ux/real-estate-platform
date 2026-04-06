import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { loadStayListingForEditor } from "@/lib/admin/stay-listing-edit";
import { setListingPhotos } from "@/lib/bnhub/listings";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** PUT { photos: { url, sortOrder?, isCover? }[] } */
export async function PUT(req: NextRequest, ctx: Ctx) {
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const { row, forbidden } = await loadStayListingForEditor(id, userId);
  if (forbidden) return Response.json({ error: "Forbidden" }, { status: 403 });
  if (!row) return Response.json({ error: "Not found" }, { status: 404 });

  let body: { photos?: unknown };
  try {
    body = (await req.json()) as { photos?: unknown };
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const raw = Array.isArray(body.photos) ? body.photos : [];
  const photos = raw
    .map((p) =>
      typeof p === "string"
        ? { url: p }
        : p && typeof p === "object" && typeof (p as { url?: string }).url === "string"
          ? {
              url: (p as { url: string }).url,
              sortOrder: typeof (p as { sortOrder?: number }).sortOrder === "number"
                ? (p as { sortOrder: number }).sortOrder
                : undefined,
              isCover: Boolean((p as { isCover?: boolean }).isCover),
            }
          : null
    )
    .filter((x) => x != null) as { url: string; sortOrder?: number; isCover?: boolean }[];

  const updated = await setListingPhotos(id, photos);
  return Response.json({ photos: updated });
}
