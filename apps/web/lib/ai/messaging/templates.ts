/** Client-safe messaging copy helpers (no server / DB). */

export const PLATFORM_LIABILITY_DISCLAIMER_AUTOMATION =
  "Automation assists with messaging drafts and routine tasks; you remain responsible for guest communication, compliance, and accuracy.";

export type HostLifecyclePreviewSample = {
  guestName: string;
  listingTitle: string;
  checkInLabel: string;
  checkOutLabel: string;
  nights: number;
};

export type HostLifecycleTemplateKind = "booking_confirmation" | "pre_checkin";

export function renderHostLifecycleTemplate(
  kind: HostLifecycleTemplateKind,
  locale: string,
  sample: HostLifecyclePreviewSample
): string {
  const lang = locale.toLowerCase().startsWith("fr")
    ? "fr"
    : "en";
  const { guestName, listingTitle, checkInLabel, checkOutLabel, nights } = sample;

  if (kind === "booking_confirmation") {
    if (lang === "fr") {
      return (
        `Bonjour ${guestName},\n\n` +
        `Merci d'avoir réservé ${listingTitle}. Votre séjour commence le ${checkInLabel} et se termine le ${checkOutLabel} ` +
        `(${nights} nuit${nights === 1 ? "" : "s"}). Nous avons hâte de vous accueillir.\n\n` +
        `— Équipe hôte`
      );
    }
    return (
      `Hi ${guestName},\n\n` +
      `Thanks for booking ${listingTitle}. Your stay runs from ${checkInLabel} through ${checkOutLabel} ` +
      `(${nights} night${nights === 1 ? "" : "s"}). We're looking forward to hosting you.\n\n` +
      `— Your host`
    );
  }

  if (kind === "pre_checkin") {
    if (lang === "fr") {
      return (
        `Bonjour ${guestName},\n\n` +
        `Votre arrivée à ${listingTitle} approche (${checkInLabel}). ` +
        `Répondez à ce message si vous avez des questions sur l'enregistrement ou le stationnement.\n\n` +
        `— Équipe hôte`
      );
    }
    return (
      `Hi ${guestName},\n\n` +
      `Your stay at ${listingTitle} is coming up (check-in ${checkInLabel}). ` +
      `Reply if you have any questions about arrival or parking.\n\n` +
      `— Your host`
    );
  }

  return "";
}
