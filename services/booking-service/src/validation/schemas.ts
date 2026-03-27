import { z } from "zod";

const isoDateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD");

export const createBookingBodySchema = z.object({
  listingId: z.string().uuid(),
  guestId: z.string().uuid(),
  checkIn: isoDateString,
  checkOut: isoDateString,
  guestNotes: z.string().max(2000).optional(),
}).refine(
  (data) => new Date(data.checkIn) < new Date(data.checkOut),
  { message: "checkOut must be after checkIn", path: ["checkOut"] }
);

export const updateBookingBodySchema = z.object({
  guestNotes: z.string().max(2000).optional(),
  checkedInAt: z.string().datetime().optional().nullable(),
  checkedOutAt: z.string().datetime().optional().nullable(),
});

export const bookingIdParamSchema = z.object({
  bookingId: z.string().uuid(),
});

export const availabilityQuerySchema = z.object({
  listingId: z.string().uuid(),
  start: isoDateString,
  end: isoDateString,
}).refine(
  (data) => new Date(data.start) <= new Date(data.end),
  { message: "end must be on or after start", path: ["end"] }
);

export type CreateBookingBody = z.infer<typeof createBookingBodySchema>;
export type UpdateBookingBody = z.infer<typeof updateBookingBodySchema>;
export type BookingIdParam = z.infer<typeof bookingIdParamSchema>;
export type AvailabilityQuery = z.infer<typeof availabilityQuerySchema>;
