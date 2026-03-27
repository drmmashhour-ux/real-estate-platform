/**
 * Toll-free phone integration — env overrides with defaults from {@link "@/lib/config/contact"}.
 */

import {
  getContactTelHref,
  getSupportPhoneDisplay,
} from "@/lib/config/contact";

/**
 * Platform **support** number for display (toll-free).
 */
export function getPhoneNumber(): string {
  return getSupportPhoneDisplay();
}

/**
 * tel: link. No arg → platform support. Pass a number for ad-hoc links.
 */
export function getPhoneTelLink(phone?: string): string {
  if (phone?.trim()) {
    const raw = phone.trim();
    const digits = raw.replace(/\D/g, "");
    if (!digits.length) return "";
    const withPlus = raw.startsWith("+") ? `+${digits}` : digits;
    return `tel:${withPlus}`;
  }
  return getContactTelHref();
}

export function hasPhone(): boolean {
  return Boolean(getSupportPhoneDisplay().replace(/\D/g, "").length);
}
