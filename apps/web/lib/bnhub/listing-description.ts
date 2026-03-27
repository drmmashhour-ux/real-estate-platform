/**
 * Split free-form listing description into intro, bullets, and remainder for scannable UX.
 * Hosts get best results using blank lines between sections, e.g. intro paragraph, then bullet list, then details.
 */
export type ParsedListingDescription = {
  intro: string;
  bullets: string[];
  fullDescription: string;
};

function bulletText(line: string): string | null {
  const m = line.match(/^[-•*]\s+(.+)$/) ?? line.match(/^\d+[.)]\s+(.+)$/);
  return m ? m[1].trim() : null;
}

export function parseListingDescription(raw: string | null | undefined): ParsedListingDescription {
  if (!raw?.trim()) {
    return { intro: "", bullets: [], fullDescription: "" };
  }

  const text = raw.replace(/\r\n/g, "\n").trim();
  const blocks = text.split(/\n\n+/).map((b) => b.trim()).filter(Boolean);

  const bullets: string[] = [];
  const textBlocks: string[] = [];

  for (const block of blocks) {
    const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
    if (!lines.length) continue;

    const allBullets = lines.every((l) => bulletText(l) != null);
    if (allBullets) {
      for (const l of lines) {
        const t = bulletText(l);
        if (t) bullets.push(t);
      }
    } else {
      textBlocks.push(block);
    }
  }

  if (textBlocks.length > 0 || bullets.length > 0) {
    const intro = textBlocks[0] ?? "";
    const fullDescription = textBlocks.slice(1).join("\n\n");
    return { intro, bullets, fullDescription };
  }

  /* Fallback: single block or no paragraph breaks — scan line-by-line */
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const lineBullets: string[] = [];
  const nonBullet: string[] = [];
  for (const line of lines) {
    const t = bulletText(line);
    if (t) lineBullets.push(t);
    else nonBullet.push(line);
  }
  const intro = nonBullet.slice(0, 3).join(" ");
  const rest = nonBullet.slice(3).join("\n\n");
  return {
    intro: intro || text.slice(0, 200),
    bullets: lineBullets,
    fullDescription: rest,
  };
}
