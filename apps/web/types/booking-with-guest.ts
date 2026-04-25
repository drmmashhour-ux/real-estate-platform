import type { Booking } from "../../prisma/generated/analytics";
import type { User } from "../../prisma/generated/core";

/** LECIPM `Booking` (analytics client) + core `User` joined in app code (replaces Prisma `include`). */
export type BookingWithUser = Booking & { user: User | null };

/** @deprecated Use `BookingWithUser` — `user` is the guest account. */
export type BookingWithGuest = Booking & { guest: User | null };
