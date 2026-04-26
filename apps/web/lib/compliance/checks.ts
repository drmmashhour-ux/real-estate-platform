import { complianceDB } from "@/lib/db";

/**
 * OACIQ seller declaration gate for CRM `Listing` actions (e.g. broker marketplace go-live).
 * `listingId` must be the monolith `Listing.id` (not `ShortTermListing` / marketplace shard ids).
 */
export async function validateListing(listingId: string): Promise<void> {
  const ds =
    await complianceDB.lecipmCrmOaciqSellerDeclaration.findFirst({
      where: { listingId },
    });

  if (!ds) {
    throw new Error("Seller Declaration (DS) required");
  }

  if (ds.refused) {
    throw new Error("Seller Declaration refused — resolve before go-live");
  }

  if (!ds.completed) {
    throw new Error("Seller Declaration incomplete");
  }
}
