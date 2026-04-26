import { marketplacePrisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth/middleware";

/** Public read for marketplace `listings` rows (same source as `GET /api/listings`). */
export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const listing = await marketplacePrisma.listing.findUnique({
    where: { id },
  });
  if (!listing) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  return Response.json(listing);
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const user = requireAuth(req);

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  const listing = await marketplacePrisma.listing.findUnique({
    where: { id },
  });

  if (!listing || listing.userId !== user.userId) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  await marketplacePrisma.listing.delete({
    where: { id },
  });

  return Response.json({ success: true });
}
