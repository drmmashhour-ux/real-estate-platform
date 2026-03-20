/**
 * Toll-free phone integration. All values from environment variables.
 */

/**
 * Company phone for display (e.g. "+1 (514) 555-1234").
 * Prefer NEXT_PUBLIC_CONTACT_PHONE so footer and other client components receive the value at build time.
 */
export function getPhoneNumber(): string {
  return (
    process.env.NEXT_PUBLIC_CONTACT_PHONE?.trim() ?? process.env.PHONE_NUMBER?.trim() ?? ""
  );
}

/**
 * tel: link for click-to-call. Pass no arg for company number, or a number for client.
 * Normalizes to digits (and leading +) for tel: URI.
 */
export function getPhoneTelLink(phone?: string): string {
  const raw =
    phone?.trim() ??
    process.env.NEXT_PUBLIC_CONTACT_PHONE?.trim() ??
    process.env.PHONE_NUMBER?.trim() ??
    "";
  const digits = raw.replace(/\D/g, "");
  if (!digits.length) return "";
  const withPlus = raw.startsWith("+") ? `+${digits}` : digits;
  return `tel:${withPlus}`;
}

export function hasPhone(): boolean {
  return Boolean(process.env.PHONE_NUMBER?.trim());
}
