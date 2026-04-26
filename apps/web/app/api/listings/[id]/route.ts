import { authPrisma } from "@/lib/db";
import { getListingsDB } from "@/lib/db/routeSwitch";
import { requireAuth } from "@/lib/auth/middleware";

/** Public read for marketplace `listings` rows (same source as `GET /api/listings`). */
export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const db = getListingsDB();
  console.log("[LISTINGS DB] getListingsDB()");
  const { id } = await context.params;
  const listing = await db.listing.findUnique({
    where: { id },
  });
  if (!listing) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  const host = listing.userId
    ? await authPrisma.user.findUnique({ where: { id: listing.userId } })
    : null;
  return Response.json({ ...listing, host });
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
  const db = getListingsDB();

  const listing = await db.listing.findUnique({
    where: { id },
  });

  if (!listing || listing.userId !== user.userId) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  await db.listing.delete({
    where: { id },
  });

  return Response.json({ success: true });
}
