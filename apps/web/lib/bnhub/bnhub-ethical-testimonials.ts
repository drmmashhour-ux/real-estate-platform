/**
 * Real pilot quotes only — set via env in deployment. When unset, UI should hide cards
 * (no fabricated attributions).
 */
export type BnhubEthicalTestimonial = {
  quote: string;
  attribution: string;
  role: "host" | "guest";
};

function trim(s: string | undefined): string | null {
  const t = s?.trim();
  return t ? t : null;
}

export function getBnhubEthicalTestimonials(): {
  host: BnhubEthicalTestimonial | null;
  guest: BnhubEthicalTestimonial | null;
} {
  const hostQuote = trim(process.env.BNHUB_TESTIMONIAL_HOST_QUOTE);
  const hostAttr = trim(process.env.BNHUB_TESTIMONIAL_HOST_ATTRIBUTION);
  const guestQuote = trim(process.env.BNHUB_TESTIMONIAL_GUEST_QUOTE);
  const guestAttr = trim(process.env.BNHUB_TESTIMONIAL_GUEST_ATTRIBUTION);

  return {
    host:
      hostQuote && hostAttr
        ? { quote: hostQuote, attribution: hostAttr, role: "host" as const }
        : null,
    guest:
      guestQuote && guestAttr
        ? { quote: guestQuote, attribution: guestAttr, role: "guest" as const }
        : null,
  };
}
