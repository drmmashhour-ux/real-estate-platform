import type { SyriaAppUser } from "@/generated/prisma";
import { prisma } from "@/lib/db";

/**
 * Guest account keyed by phone — same identity as `persistQuickListing` MVP flow.
 */
export async function ensureGuestUserForPhone(phoneDigits: string, nameHint?: string): Promise<SyriaAppUser> {
  const guestEmail = `mvp-${phoneDigits}@guest.hadiah`;
  const name = (nameHint ?? phoneDigits).slice(0, 120);
  return prisma.syriaAppUser.upsert({
    where: { email: guestEmail },
    create: {
      email: guestEmail,
      name,
      phone: phoneDigits,
    },
    update: {
      name,
      phone: phoneDigits,
    },
  });
}
