const MS_DAY = 86_400_000;
const HORIZON_DAYS = 500;

function utcDayStart(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export function addUtcDays(d: Date, n: number): Date {
  return new Date(utcDayStart(d).getTime() + n * MS_DAY);
}

type Interval = { s: number; e: number };

export function mergeBookingIntervals(bookings: { checkIn: Date; checkOut: Date }[]): Interval[] {
  const inv: Interval[] = bookings.map((b) => {
    const s = utcDayStart(b.checkIn).getTime();
    const e = utcDayStart(b.checkOut).getTime();
    return s < e ? { s, e } : { s, e: s + MS_DAY };
  });
  inv.sort((a, b) => a.s - b.s);
  const out: Interval[] = [];
  for (const x of inv) {
    const last = out[out.length - 1];
    if (!last || x.s > last.e) {
      out.push({ ...x });
    } else {
      last.e = Math.max(last.e, x.e);
    }
  }
  return out;
}

export function firstAvailableNightFrom(merged: Interval[], fromDay: Date): Date | null {
  const from = utcDayStart(fromDay).getTime();
  const limit = from + HORIZON_DAYS * MS_DAY;
  for (let t = from; t < limit; t += MS_DAY) {
    const inBlock = merged.some((m) => t >= m.s && t < m.e);
    if (!inBlock) return new Date(t);
  }
  return null;
}

export type ListingAvailability = {
  totalBookedDays: number;
  nextAvailableDate: Date | null;
  occupancyRate: number;
};

export function getAvailabilityUrgencyLabel(occupancyRate: number): "high_demand" | "almost_full" | null {
  if (occupancyRate > 0.9) return "almost_full";
  if (occupancyRate > 0.7) return "high_demand";
  return null;
}

const URGENCY_COPY: Record<Exclude<ReturnType<typeof getAvailabilityUrgencyLabel>, null>, string> = {
  high_demand: "High demand for this listing",
  almost_full: "Almost fully booked",
};

export function availabilityUrgencyMessage(occupancyRate: number): string | null {
  const u = getAvailabilityUrgencyLabel(occupancyRate);
  return u ? URGENCY_COPY[u] : null;
}
