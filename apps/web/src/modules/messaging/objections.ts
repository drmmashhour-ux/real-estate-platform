/**
 * Map inbound text → `message_templates.type` (segment `warm`).
 *
 * Priority (fix order): trust → uncertainty → timing / “think” → price
 * — matches how people often say “I'll think about it” when trust or clarity is the real issue.
 */
export function resolveObjectionTemplateType(text: string): string | null {
  const t = text.toLowerCase();

  if (/help me (do|complete)|do it together|walk me through|can we do it/i.test(t)) {
    return "assisted_close";
  }

  if (/scam|fraud|fake|trust|safe|legit|secure|stripe|verified|rip-?off/i.test(t)) {
    return "objection_trust";
  }

  if (
    /not sure|hesitat|unclear|confus|don't understand|do not understand|something wrong|doesn't make sense|not comfortable/i.test(
      t
    ) &&
    !/think about|need to think|let me think/i.test(t)
  ) {
    return "objection_hesitation";
  }

  if (/think about|need to think|let me think|sleep on it|get back to you/i.test(t)) {
    return "objection_think";
  }

  if (/later|tomorrow|next week|busy|not now|bad timing|call me back|in a few days/i.test(t)) {
    return "objection_later";
  }

  if (/expensive|too much|price|cost|cheap|budget|can't afford|cannot afford|overpriced/i.test(t)) {
    return "objection_expensive";
  }

  return null;
}

export async function getObjectionTemplateTypeForMessage(inbound: string): Promise<string | null> {
  return resolveObjectionTemplateType(inbound);
}
