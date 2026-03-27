/** Cross-component open for Immo AI sheet (listing page top rail + sticky bar share one listener). */
export const IMMO_OPEN_CHAT_EVENT = "immo-open-chat";

export type ImmoOpenChatDetail = { listingId: string; channel?: string };

export function dispatchOpenImmoChat(detail: ImmoOpenChatDetail): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(IMMO_OPEN_CHAT_EVENT, { detail }));
}
