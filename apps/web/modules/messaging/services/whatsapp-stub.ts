/**
 * WhatsApp Business Cloud API — stub. Wire META_WHATSAPP_* when ready.
 */
export function isWhatsAppConfigured(): boolean {
  return Boolean(process.env.META_WHATSAPP_TOKEN?.trim() && process.env.META_WHATSAPP_PHONE_ID?.trim());
}

export async function sendWhatsAppText(_params: {
  toE164: string;
  body: string;
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  if (!isWhatsAppConfigured()) {
    console.info("[WhatsApp] Skipped (not configured)");
    return { ok: false, error: "NOT_CONFIGURED" };
  }
  // Implement Graph API send when credentials exist
  return { ok: false, error: "NOT_IMPLEMENTED" };
}
