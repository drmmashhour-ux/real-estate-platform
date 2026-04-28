import { getLegacyDB } from "@/lib/db/legacy";
import { safeDbCall } from "@/lib/db-safe";
const prisma = getLegacyDB();
import { requireAuth } from "@/lib/auth/middleware";

export async function GET(req: Request) {
  const user = requireAuth(req);

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const listings = await safeDbCall(
    () =>
      prisma.listing.findMany({
        where: { userId: user.userId },
        orderBy: { createdAt: "desc" },
      }),
    []
  );

  return Response.json(listings);
}
