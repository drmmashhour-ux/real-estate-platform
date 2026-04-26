import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();

export const dynamic = "force-dynamic";

/**
 * GET — Buyer Hub inquiries (CRM leads with leadSource BUYER for this user).
 */
export async function GET() {
  const userId = await getGuestId();
  if (!userId) {
    return Response.json({ error: "Sign in required" }, { status: 401 });
  }

  const leads = await prisma.lead.findMany({
    where: { userId, leadSource: "BUYER" },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      message: true,
      createdAt: true,
      fsboListingId: true,
      listingId: true,
      listingCode: true,
    },
  });

  return Response.json({ inquiries: leads });
}
