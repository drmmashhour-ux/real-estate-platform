import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { requireAuth } from "@/lib/auth/middleware";

export async function GET(req: Request) {
  const user = requireAuth(req);

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const listings = await prisma.listing.findMany({
    where: { userId: user.userId },
    orderBy: { createdAt: "desc" },
  });

  return Response.json(listings);
}
