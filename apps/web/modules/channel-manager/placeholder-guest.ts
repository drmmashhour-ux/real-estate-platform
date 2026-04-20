import { AccountStatus, PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";

const CHANNEL_IMPORT_GUEST_EMAIL = "bnb.channel.placeholder@guest.bnhub.system";

/**
 * Shared synthetic guest account for reservations recorded from external OTAs in BNHub.
 * Keeps BNHub booking rows valid without merging external PII prematurely.
 */
export async function ensureBnhubChannelPlaceholderGuest(): Promise<string> {
  const row = await prisma.user.upsert({
    where: { email: CHANNEL_IMPORT_GUEST_EMAIL },
    create: {
      email: CHANNEL_IMPORT_GUEST_EMAIL,
      name: "External channel guest",
      role: PlatformRole.USER,
      accountStatus: AccountStatus.ACTIVE,
    },
    update: {},
    select: { id: true },
  });
  return row.id;
}
