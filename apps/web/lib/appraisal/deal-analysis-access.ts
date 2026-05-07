/**
 * Deal analysis access control — stub for deployment.
 */
export async function canAccessDealAnalysisForListing(
  userId: string,
  listingId: string
): Promise<boolean> {
  void userId;
  void listingId;
  return true;
}
