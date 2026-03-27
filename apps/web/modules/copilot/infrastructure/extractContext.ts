/** Pull first UUID from free text (listing ids in chat). */
export function extractUuidFromText(text: string): string | null {
  const m = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.exec(text.trim());
  return m ? m[0].toLowerCase() : null;
}
