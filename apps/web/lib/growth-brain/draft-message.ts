/**
 * Operator-review drafts only — no auto-send.
 */
export function draftOutreachFollowUp(params: { name?: string | null; city?: string | null }): string {
  const n = params.name?.trim() || "there";
  const c = params.city?.trim();
  const place = c ? ` in ${c}` : "";
  return `Hi ${n},\n\nFollowing up on your interest${place}. If you’re still exploring LECIPM, reply with a good time and any questions — we’re happy to help with next steps.\n\n— LECIPM team`;
}

export function draftStaleLeadReminder(count: number): string {
  return `Internal reminder: ${count} growth leads are flagged for follow-up. Review the CRM pipeline and mark outreach as sent after contact.`;
}
