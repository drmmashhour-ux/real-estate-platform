/**
 * Lead-time hints for guests (no automatic discounts unless product adds rules later).
 */

export function nightsUntilCheckInUtc(checkInIsoDate: string, now = new Date()): number | null {
  const d = checkInIsoDate.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return null;
  const [y, m, day] = d.split("-").map(Number);
  const checkIn = Date.UTC(y!, m! - 1, day!);
  const startToday = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const diff = checkIn - startToday;
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return Number.isFinite(days) ? days : null;
}

export type EarlyBookingHint = {
  leadDays: number;
  title: string;
  body: string;
};

/**
 * Informational copy only — does not change prices.
 */
export function earlyBookingHintForLeadDays(leadDays: number | null): EarlyBookingHint | null {
  if (leadDays == null || leadDays < 14) return null;
  if (leadDays >= 60) {
    return {
      leadDays,
      title: "Early booking",
      body: `Your trip is about ${leadDays} days out. Many hosts hold better availability and calmer rates when you plan ahead — worth locking dates you want before peak weekends fill up.`,
    };
  }
  if (leadDays >= 30) {
    return {
      leadDays,
      title: "Book ahead",
      body: `You’re planning roughly ${leadDays} days ahead. Popular nights still tend to be available, but earlier booking often avoids last-minute surges and fees elsewhere.`,
    };
  }
  return {
    leadDays,
    title: "Planning ahead",
    body: `Booking about two weeks or more before check-in often means more choice and less stress than same-week trips — especially in busy seasons.`,
  };
}
