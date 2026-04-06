export type CeoAlert = {
  id: string;
  severity: "info" | "warn" | "critical";
  title: string;
  detail: string;
};

export type CeoAlertInput = {
  trafficEvents24h: number;
  trafficEventsPrev24h: number;
  bookingsToday: number;
  hourUtc: number;
  newLeads30d: number;
  wonLeads30d: number;
  pipelineConversionPct: number | null;
  bookings7d: number;
  bookingsPrev7d: number;
};

/**
 * Rule-based CEO alerts (activity drops, booking gaps, weak pipeline conversion).
 */
export function deriveCeoAlerts(i: CeoAlertInput): CeoAlert[] {
  const out: CeoAlert[] = [];

  if (i.trafficEventsPrev24h >= 20 && i.trafficEvents24h < i.trafficEventsPrev24h * 0.5) {
    out.push({
      id: "activity_drop",
      severity: "warn",
      title: "Traffic / activity dip",
      detail: `Last 24h events (${i.trafficEvents24h}) are well below the prior 24h (${i.trafficEventsPrev24h}). Check campaigns and product health.`,
    });
  }

  if (i.bookings7d > 0 && i.bookingsPrev7d > 0 && i.bookings7d < Math.max(3, Math.floor(i.bookingsPrev7d * 0.4))) {
    out.push({
      id: "booking_week_drop",
      severity: "warn",
      title: "Bookings down vs prior week",
      detail: `Rolling 7d bookings (${i.bookings7d}) dropped materially vs the previous 7d (${i.bookingsPrev7d}).`,
    });
  }

  if (i.bookingsToday === 0 && i.hourUtc >= 12) {
    out.push({
      id: "no_bookings_today",
      severity: "info",
      title: "No new bookings today (UTC day)",
      detail: "Still early or a quiet day — confirm BNHub checkout and host availability if this persists.",
    });
  }

  if (i.newLeads30d >= 30 && i.pipelineConversionPct !== null && i.pipelineConversionPct < 2) {
    out.push({
      id: "low_conversion",
      severity: "critical",
      title: "Low pipeline win rate (30d)",
      detail: `Only ${i.pipelineConversionPct.toFixed(1)}% of new leads (30d) closed as won. Review Close Room queue and sales motion.`,
    });
  }

  return out;
}
