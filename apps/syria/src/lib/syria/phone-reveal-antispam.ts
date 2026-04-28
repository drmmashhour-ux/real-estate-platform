import { prisma } from "@/lib/db";

function utcDayString(now = Date.now()): string {
  return new Date(now).toISOString().slice(0, 10);
}

/** Above this many reveals per listing per UTC day → temporary cooldown. */
const MAX_REVEALS_BEFORE_COOLDOWN = 35;
const COOLDOWN_MS = 6 * 60 * 60 * 1000;

/**
 * Increments per-listing reveal tally and may set `phoneRevealCooldownUntil`.
 * ORDER SYBNB-97 — reduces scripted scraping of seller numbers.
 */
export async function recordListingPhoneRevealForAntispam(listingId: string): Promise<void> {
  const listing = await prisma.syriaProperty.findUnique({
    where: { id: listingId },
    select: {
      phoneRevealDayUtc: true,
      phoneRevealCountDay: true,
      phoneRevealCooldownUntil: true,
    },
  });
  if (!listing) return;

  const day = utcDayString();
  const sameDay = listing.phoneRevealDayUtc === day;
  const nextCount = sameDay ? listing.phoneRevealCountDay + 1 : 1;

  let phoneRevealCooldownUntil = listing.phoneRevealCooldownUntil;
  if (nextCount > MAX_REVEALS_BEFORE_COOLDOWN) {
    const candidate = new Date(Date.now() + COOLDOWN_MS);
    phoneRevealCooldownUntil =
      !phoneRevealCooldownUntil || candidate > phoneRevealCooldownUntil ? candidate : phoneRevealCooldownUntil;
  }

  await prisma.syriaProperty.update({
    where: { id: listingId },
    data: {
      phoneRevealDayUtc: day,
      phoneRevealCountDay: nextCount,
      phoneRevealCooldownUntil,
    },
  });
}
