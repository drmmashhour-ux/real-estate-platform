import type { SyriaAppUser } from "@/generated/prisma";
import { prisma } from "@/lib/db";
import { sybn108OptionalTestFields } from "@/lib/sybn/sybn108-test-mode";

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
      ...sybn108OptionalTestFields(),
    },
    update: {
      name,
      phone: phoneDigits,
    },
  });
}
