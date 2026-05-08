/**
 * Broker appraisal case service — stub for deployment.
 */
export async function getBrokerAppraisalCaseForUser(
  userId: string,
  listingId: string
): Promise<{ id: string; status: string } | null> {
  void userId;
  void listingId;
  return null;
}
