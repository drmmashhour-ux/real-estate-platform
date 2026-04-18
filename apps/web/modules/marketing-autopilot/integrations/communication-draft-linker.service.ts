/**
 * Placeholder bridge to communication copilot — v1 returns empty (wire when draft export API exists).
 */
export async function suggestCommunicationDraftExports(_listingId: string): Promise<{ note: string }> {
  return { note: "Export vers le copilote de communication: brancher dans une itération suivante." };
}
