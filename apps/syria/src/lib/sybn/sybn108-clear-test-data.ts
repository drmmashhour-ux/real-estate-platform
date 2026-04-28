/**
 * ORDER SYBNB-108 — Delete all rows flagged `isTest` (admin cleanup).
 * Deletes listings first (cascade clears dependent bookings/messages), then orphan test bookings/users.
 */
import { prisma } from "@/lib/db";

export type ClearSybn108TestDataResult = {
  deletedProperties: number;
  deletedSybnbBookingsOrphan: number;
  deletedSyriaBookingsOrphan: number;
  deletedUsers: number;
};

export async function clearAllSybn108TestData(): Promise<ClearSybn108TestDataResult> {
  return prisma.$transaction(async (tx) => {
    const sybnb = await tx.sybnbBooking.deleteMany({ where: { isTest: true } });
    const syriaB = await tx.syriaBooking.deleteMany({ where: { isTest: true } });
    const props = await tx.syriaProperty.deleteMany({ where: { isTest: true } });
    const users = await tx.syriaAppUser.deleteMany({ where: { isTest: true } });

    return {
      deletedProperties: props.count,
      deletedSybnbBookingsOrphan: sybnb.count,
      deletedSyriaBookingsOrphan: syriaB.count,
      deletedUsers: users.count,
    };
  });
}
