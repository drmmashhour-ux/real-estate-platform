import type { Prisma } from "@prisma/client";

/** Bucket CTAs by intent for winner detection. */
export function extractCtaBucket(script: string, caption: string): string {
  const text = `${script}\n${caption}`.toLowerCase();
  const line =
    text.match(/cta[:\s]+([^\n]+)/i)?.[1]?.trim() ??
    text.match(/(book|reserve|check|save|unlock|today|now|limited)[^\n.]{0,40}/i)?.[0];
  const t = (line ?? "general").slice(0, 80);
  if (/\b(book|reserve)\b/.test(t)) return "book_reserve";
  if (/\b(today|now|limited|last|hurry)\b/.test(t)) return "urgency";
  if (/\b(save|deal)\b/.test(t)) return "save_deal";
  if (/\b(check|see|view|open)\b/.test(t)) return "soft_check";
  return "other";
}

export function extractVisualOrderKey(metadataJson: Prisma.JsonValue): string {
  if (!metadataJson || typeof metadataJson !== "object" || Array.isArray(metadataJson)) {
    return "unknown";
  }
  const m = metadataJson as Record<string, unknown>;
  const vo = m.visualOrder ?? m.visual_order;
  if (typeof vo === "string") return vo;
  if (m.heroFirst === true || m.hero_first === true) return "hero_first";
  return "unknown";
}
