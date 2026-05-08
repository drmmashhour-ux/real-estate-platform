/**
 * Auto adjustment engine for appraisals — stub for deployment.
 */
export async function generateAutoAdjustments(opts: {
  listingId: string;
  userId: string;
}): Promise<{ adjustments: unknown[]; generated: boolean }> {
  void opts;
  return { adjustments: [], generated: false };
}
