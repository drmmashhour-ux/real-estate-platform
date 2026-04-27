import { Prisma } from "@/generated/prisma";
import type { SyriaProperty } from "@/generated/prisma";
import { SYRIA_PRICING } from "@/lib/pricing";

export function sybnbNightsBetween(checkIn: Date, checkOut: Date): number {
  const ms = checkOut.getTime() - checkIn.getTime();
  const n = Math.ceil(ms / 86400000);
  return Math.max(1, n);
}

export function computeSybnbQuote(
  property: Pick<SyriaProperty, "pricePerNight" | "price" | "currency">,
  checkIn: Date,
  checkOut: Date,
): {
  nights: number;
  nightly: Prisma.Decimal;
  total: Prisma.Decimal;
  platformFee: Prisma.Decimal;
  hostNet: Prisma.Decimal;
  currency: string;
} {
  const nights = sybnbNightsBetween(checkIn, checkOut);
  const nightly =
    property.pricePerNight != null
      ? new Prisma.Decimal(property.pricePerNight)
      : property.price;
  const total = nightly.mul(new Prisma.Decimal(nights));
  const rate = new Prisma.Decimal(String(SYRIA_PRICING.bnhubCommissionRate));
  const platformFee = total.mul(rate);
  const hostNet = total.sub(platformFee);
  return {
    nights,
    nightly,
    total,
    platformFee,
    hostNet,
    currency: property.currency ?? SYRIA_PRICING.currency,
  };
}
