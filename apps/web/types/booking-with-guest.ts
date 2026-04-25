import type { Booking, User } from "@prisma/client";

/** LECIPM `Booking` row + guest `User` resolved in app code (no Prisma `include`). */
export type BookingWithGuest = Booking & {
  guest: User | null;
};
