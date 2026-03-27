/**
 * Account restrictions: RESTRICTED users cannot publish, withdraw, or create certain content.
 */

import { prisma } from "@/lib/db";

export async function isUserRestrictedOrBanned(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { accountStatus: true },
  });
  return (
    user?.accountStatus === "RESTRICTED" ||
    user?.accountStatus === "SUSPENDED" ||
    user?.accountStatus === "BANNED"
  );
}

export async function canUserPublishListing(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { accountStatus: true },
  });
  return user?.accountStatus === "ACTIVE";
}

export async function canUserWithdraw(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { accountStatus: true },
  });
  return user?.accountStatus === "ACTIVE";
}

export async function canUserCreateBooking(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { accountStatus: true },
  });
  return user?.accountStatus === "ACTIVE";
}
