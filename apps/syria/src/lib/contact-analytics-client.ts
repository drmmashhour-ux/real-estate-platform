"use client";

/**
 * SYBNB-11 — `contact_click` funnel (stored in `SybnbEvent`). Fire-and-forget before navigating to WhatsApp/tel.
 * ORDER SYBNB-85 — `trackListingPhoneReveal` (`phone_reveal`) measures masked-number taps separately from channel clicks.
 */
export function trackListingPhoneReveal(listingId: string): void {
  void fetch("/api/sybnb/events", {
    method: "POST",
    headers: { "Content-Type": "application/json;charset=utf-8" },
    body: JSON.stringify({ type: "phone_reveal", listingId }),
    credentials: "same-origin",
    keepalive: true,
  }).catch(() => undefined);
}

export function trackListingContactClick(listingId: string, channel: "whatsapp" | "tel"): void {
  void fetch("/api/sybnb/events", {
    method: "POST",
    headers: { "Content-Type": "application/json;charset=utf-8" },
    body: JSON.stringify({ type: "contact_click", listingId, channel }),
    credentials: "same-origin",
    keepalive: true,
  }).catch(() => undefined);
}

/** SYBNB-40 — hotel listing WhatsApp / phone leads (`SybnbEvent.type = hotel_contact_click`). */
export function trackHotelContactClick(listingId: string, channel: "whatsapp" | "tel"): void {
  void fetch("/api/sybnb/events", {
    method: "POST",
    headers: { "Content-Type": "application/json;charset=utf-8" },
    body: JSON.stringify({ type: "hotel_contact_click", listingId, channel }),
    credentials: "same-origin",
    keepalive: true,
  }).catch(() => undefined);
}
