/**
 * Fire-and-forget lead tracking — do not await (keep WhatsApp / dialer instant).
 */
function postLead(path: "/api/lead/whatsapp" | "/api/lead/phone", listingId: string): void {
  void fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ listingId }),
  });
}

export function trackLeadWhatsappClick(listingId: string): void {
  if (!listingId) return;
  postLead("/api/lead/whatsapp", listingId);
}

export function trackLeadPhoneClick(listingId: string): void {
  if (!listingId) return;
  postLead("/api/lead/phone", listingId);
}
