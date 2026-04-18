import { generateSmartPrice } from "@/lib/bnhub/smart-pricing";

export async function estimateDemandForListing(listingId: string): Promise<{
  demandLevel: "low" | "medium" | "high";
  peerBookingsLast30d: number;
  peerListingCount: number;
}> {
  const s = await generateSmartPrice(listingId);
  return {
    demandLevel: s.demandLevel,
    peerBookingsLast30d: s.peerBookingsLast30d,
    peerListingCount: s.peerListingCount,
  };
}
