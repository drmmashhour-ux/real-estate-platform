import { Router, type Request, type Response } from "express";
import {
  createBookingBodySchema,
  updateBookingBodySchema,
  bookingIdParamSchema,
  availabilityQuerySchema,
} from "../validation/schemas.js";
import { validateBody, validateParams, validateQuery, sendValidationError } from "../validation/validate.js";
import {
  createBooking,
  getBookingById,
  updateBooking,
  cancelBooking,
} from "../booking/bookingService.js";
import { getAvailability } from "../booking/availability.js";

function toBookingResponse(booking: Awaited<ReturnType<typeof getBookingById>>) {
  if (!booking) return null;
  return {
    id: booking.id,
    checkIn: booking.checkIn.toISOString().slice(0, 10),
    checkOut: booking.checkOut.toISOString().slice(0, 10),
    nights: booking.nights,
    totalCents: booking.totalCents,
    guestFeeCents: booking.guestFeeCents,
    hostFeeCents: booking.hostFeeCents,
    status: booking.status,
    guestNotes: booking.guestNotes ?? null,
    checkedInAt: booking.checkedInAt?.toISOString() ?? null,
    checkedOutAt: booking.checkedOutAt?.toISOString() ?? null,
    createdAt: booking.createdAt.toISOString(),
    updatedAt: booking.updatedAt.toISOString(),
    guestId: booking.guestId,
    listingId: booking.listingId,
    guest: booking.guest,
    listing: booking.listing,
    payment: booking.payment
      ? {
          id: booking.payment.id,
          amountCents: booking.payment.amountCents,
          status: booking.payment.status,
          guestFeeCents: booking.payment.guestFeeCents,
          hostFeeCents: booking.payment.hostFeeCents,
        }
      : null,
  };
}

export function createBookingsRouter(): Router {
  const router = Router();

  /** POST /bookings — create a new booking (availability checked, price calculated). */
  router.post("/", async (req: Request, res: Response): Promise<void> => {
    const validation = validateBody(createBookingBodySchema, req.body);
    if (!validation.success) {
      sendValidationError(res, validation.errors);
      return;
    }
    try {
      const booking = await createBooking(validation.data);
      res.status(201).json(toBookingResponse(booking));
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to create booking";
      const status = message.includes("not found") || message.includes("not available") || message.includes("Invalid") ? 400 : 500;
      res.status(status).json({ error: { code: "BOOKING_ERROR", message } });
    }
  });

  /** GET /bookings/:bookingId — get a booking by ID. */
  router.get("/:bookingId", async (req: Request, res: Response): Promise<void> => {
    const paramValidation = validateParams(bookingIdParamSchema, req.params);
    if (!paramValidation.success) {
      sendValidationError(res, paramValidation.errors);
      return;
    }
    const booking = await getBookingById(paramValidation.data.bookingId);
    if (!booking) {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "Booking not found" } });
      return;
    }
    res.json(toBookingResponse(booking));
  });

  /** PATCH /bookings/:bookingId — update guestNotes, checkedInAt, checkedOutAt. */
  router.patch("/:bookingId", async (req: Request, res: Response): Promise<void> => {
    const paramValidation = validateParams(bookingIdParamSchema, req.params);
    if (!paramValidation.success) {
      sendValidationError(res, paramValidation.errors);
      return;
    }
    const bodyValidation = validateBody(updateBookingBodySchema, req.body);
    if (!bodyValidation.success) {
      sendValidationError(res, bodyValidation.errors);
      return;
    }
    const updated = await updateBooking(paramValidation.data.bookingId, bodyValidation.data);
    if (!updated) {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "Booking not found" } });
      return;
    }
    res.json(toBookingResponse(updated));
  });

  /** POST /bookings/:bookingId/cancel — cancel a PENDING or CONFIRMED booking. */
  router.post("/:bookingId/cancel", async (req: Request, res: Response): Promise<void> => {
    const paramValidation = validateParams(bookingIdParamSchema, req.params);
    if (!paramValidation.success) {
      sendValidationError(res, paramValidation.errors);
      return;
    }
    const result = await cancelBooking(paramValidation.data.bookingId);
    if (!result.success) {
      const status = result.error === "Booking not found" ? 404 : 400;
      res.status(status).json({ error: { code: "CANCEL_FAILED", message: result.error } });
      return;
    }
    res.json(toBookingResponse(result.booking));
  });

  return router;
}

export function createAvailabilityRouter(): Router {
  const router = Router();

  /** GET /availability — calendar availability for a listing (query: listingId, start, end). */
  router.get("/", async (req: Request, res: Response): Promise<void> => {
    const validation = validateQuery(availabilityQuerySchema, req.query);
    if (!validation.success) {
      sendValidationError(res, validation.errors);
      return;
    }
    const { listingId, start, end } = validation.data;
    const slots = await getAvailability(listingId, new Date(start), new Date(end));
    res.json({ slots });
  });

  return router;
}
