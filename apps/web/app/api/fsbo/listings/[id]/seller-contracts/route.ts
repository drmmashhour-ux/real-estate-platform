import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { getGuestId } from "@/lib/auth/session";
import { ensureSellerContractsForFsboListing } from "@/lib/contracts/fsbo-seller-contracts";

export const dynamic = "force-dynamic";

/** GET — marketplace contracts for this FSBO listing (owner only). */
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const userId = await getGuestId();
  if (!userId) {
    return Response.json({ error: "Sign in required" }, { status: 401 });
  }

  const listing = await prisma.fsboListing.findUnique({
    where: { id },
    select: { ownerId: true },
  });
  if (!listing || listing.ownerId !== userId) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  await ensureSellerContractsForFsboListing(id).catch(() => {});

  const contracts = await prisma.contract.findMany({
    where: { fsboListingId: id },
    select: {
      id: true,
      type: true,
      title: true,
      status: true,
      signedAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return Response.json({ contracts });
}
