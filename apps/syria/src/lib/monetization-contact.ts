import { buildTelHref, buildWhatsAppContactHref, onlyDigits } from "@/lib/syria-phone";

/**
 * Admin number for the "Make Featured" owner flow (WhatsApp + call).
 * Set `HADIAH_MONETIZATION_PHONE` (or legacy `SYRIA_MONETIZATION_ADMIN_PHONE`) to E.164 digits, 09…, or 963…
 *
 * **Manual featured tier (no payment UI):** in DB, set `syria_properties.plan` to `featured` (e.g. Prisma Studio or SQL).
 */
export function getMonetizationAdminContact():
  | {
      displayPhone: string;
      whatsappHref: string | null;
      telHref: string | null;
    }
  | null {
  const raw = (process.env.HADIAH_MONETIZATION_PHONE ?? process.env.SYRIA_MONETIZATION_ADMIN_PHONE ?? "").trim();
  if (!raw) return null;
  const d = onlyDigits(raw);
  if (d.length < 8) return null;
  return {
    displayPhone: raw,
    whatsappHref: buildWhatsAppContactHref(d),
    telHref: buildTelHref(d),
  };
}
