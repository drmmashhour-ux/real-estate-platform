/**
 * Syria-first links: one tap to WhatsApp with a prefilled message (no automation).
 */
export function getSyriaPublicOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_SYRIA_APP_URL ?? "";
  return raw.replace(/\/$/, "");
}

export function buildWhatsAppSendUrl(message: string): string {
  return `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
}
