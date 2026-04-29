/** Booking lifecycle — mirror of Prisma `BookingStatus` for server queries without `@prisma/client`. */

export const BookingStatus = {
  PENDING: "PENDING",
  AWAITING_HOST_APPROVAL: "AWAITING_HOST_APPROVAL",
  CONFIRMED: "CONFIRMED",
  DECLINED: "DECLINED",
  CANCELLED_BY_GUEST: "CANCELLED_BY_GUEST",
  CANCELLED_BY_HOST: "CANCELLED_BY_HOST",
  CANCELLED: "CANCELLED",
  COMPLETED: "COMPLETED",
  DISPUTED: "DISPUTED",
  EXPIRED: "EXPIRED",
} as const;

export type BookingStatus = (typeof BookingStatus)[keyof typeof BookingStatus];
