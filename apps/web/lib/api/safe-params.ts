/**
 * Loose validation for route params — blocks obvious injection / garbage without claiming full UUID rules.
 */
export function isReasonableListingId(id: string): boolean {
  const s = id.trim();
  return s.length >= 8 && s.length <= 48 && /^[a-zA-Z0-9_-]+$/.test(s);
}
