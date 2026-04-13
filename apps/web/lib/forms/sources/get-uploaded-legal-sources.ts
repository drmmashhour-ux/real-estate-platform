/**
 * Placeholder for uploaded law packs / PDF extracts.
 * Wire to document storage / TrustGraph when available.
 */
export type UploadedLegalSource = {
  id: string;
  title: string;
  excerpt: string;
  sourceRef: string;
};

export async function getUploadedLegalSources(args: {
  brokerUserId: string;
  listingId?: string | null;
}): Promise<UploadedLegalSource[]> {
  void args.brokerUserId;
  void args.listingId;
  return [];
}
