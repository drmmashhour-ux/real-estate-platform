export type VrboPushPayload = {
  listingId: string;
  externalListingRef: string;
  connectionId: string;
};

export async function pushToVrbo(_data: VrboPushPayload): Promise<void> {
  // Future: Expedia/Vrbo partner APIs.
}
