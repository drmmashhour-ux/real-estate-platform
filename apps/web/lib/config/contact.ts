/**
 * Dual phone: platform support (toll-free) + direct broker line.
 * Override support: NEXT_PUBLIC_CONTACT_PHONE / PHONE_NUMBER
 * Override broker: NEXT_PUBLIC_BROKER_PHONE
 */

export const SUPPORT_PHONE = "+1 844 441 5444";
export const BROKER_PHONE = "+1 514 462 4457";
export const SUPPORT_PHONE_LINK = "tel:+18444415444";
export const BROKER_PHONE_LINK = "tel:+15144624457";

/** @deprecated Use SUPPORT_PHONE — kept for imports that expect CONTACT_PHONE */
export const CONTACT_PHONE = SUPPORT_PHONE;

export const CONTACT_EMAIL = "info@lecipm.com";

/** Street address shown in footer, contact page, and marketing blocks. Override with NEXT_PUBLIC_OFFICE_ADDRESS. */
export const OFFICE_ADDRESS_DEFAULT = "207-805 boul. Chomedey, Laval, QC H7V 0B1";

export function getOfficeAddress(): string {
  const v = process.env.NEXT_PUBLIC_OFFICE_ADDRESS?.trim();
  return v || OFFICE_ADDRESS_DEFAULT;
}

/** Platform support line (header, booking help, general). */
export function getSupportPhoneDisplay(): string {
  const v =
    process.env.NEXT_PUBLIC_CONTACT_PHONE?.trim() || process.env.PHONE_NUMBER?.trim() || "";
  return v || SUPPORT_PHONE;
}

/** Direct broker line (FSBO card, real estate). */
export function getBrokerPhoneDisplay(): string {
  const v = process.env.NEXT_PUBLIC_BROKER_PHONE?.trim() || "";
  return v || BROKER_PHONE;
}

export function getSupportTelHref(): string {
  const digits = getSupportPhoneDisplay().replace(/\D/g, "");
  if (!digits.length) return SUPPORT_PHONE_LINK;
  return `tel:+${digits}`;
}

export function getBrokerTelHref(): string {
  const digits = getBrokerPhoneDisplay().replace(/\D/g, "");
  if (!digits.length) return BROKER_PHONE_LINK;
  return `tel:+${digits}`;
}

/**
 * @deprecated Alias for {@link getSupportPhoneDisplay}
 */
export function getContactPhoneDisplay(): string {
  return getSupportPhoneDisplay();
}

export function getContactEmail(): string {
  const v = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || "";
  return v || CONTACT_EMAIL;
}

/**
 * Platform support click-to-call (BNHUB “call us”, header, etc.).
 * @deprecated Prefer getSupportTelHref — name kept for older call sites.
 */
export function getContactTelHref(): string {
  return getSupportTelHref();
}

export function getContactMailtoHref(): string {
  return `mailto:${getContactEmail()}`;
}

/** Default pre-filled WhatsApp message (broker line only). */
export const CONTACT_WHATSAPP_PREFILL = "Hello I need help with a booking";

/**
 * WhatsApp always uses the **broker** number (wa.me), never toll-free.
 */
export function getContactWhatsAppUrl(
  message: string = CONTACT_WHATSAPP_PREFILL
): string {
  const digits = getBrokerPhoneDisplay().replace(/\D/g, "");
  if (!digits.length) return "https://wa.me/";
  const q = encodeURIComponent(message);
  return `https://wa.me/${digits}?text=${q}`;
}
