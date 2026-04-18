/**
 * Extract @mentions from plain text (user ids must be resolved by caller).
 */
export function extractMentionHandles(body: string): string[] {
  const re = /@([a-zA-Z0-9._-]{2,64})/g;
  const out = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = re.exec(body)) !== null) {
    out.add(m[1]!);
  }
  return [...out];
}
