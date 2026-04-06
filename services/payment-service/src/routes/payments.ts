import { Router, type Request, type Response } from "express";
import {
  confirmPaymentBodySchema,
  refundPaymentBodySchema,
  historyQuerySchema,
} from "../validation/schemas.js";
import { validateBody, validateQuery, sendValidationError } from "../validation/validate.js";
import { confirmPayment, refundPayment, getHistory } from "../payments/paymentService.js";

function toPaymentResponse(payment: Awaited<ReturnType<typeof confirmPayment>>) {
  if (!payment) return null;
  return {
    id: payment.id,
    bookingId: payment.bookingId,
    amountCents: payment.amountCents,
    guestFeeCents: payment.guestFeeCents,
    hostFeeCents: payment.hostFeeCents,
    hostPayoutCents: payment.hostPayoutCents,
    status: payment.status,
    stripePaymentId: payment.stripePaymentId ?? null,
    createdAt: payment.createdAt.toISOString(),
    updatedAt: payment.updatedAt.toISOString(),
    booking: payment.booking
      ? {
          id: payment.booking.id,
          checkIn: payment.booking.checkIn.toISOString().slice(0, 10),
          checkOut: payment.booking.checkOut.toISOString().slice(0, 10),
          status: payment.booking.status,
        }
      : null,
  };
}

export function createPaymentsRouter(): Router {
  const router = Router();

  /**
   * POST /payments/intent — removed (PCI): card data must never touch this service.
   * Use Stripe Checkout Sessions from the platform app only.
   */
  router.post("/intent", async (_req: Request, res: Response): Promise<void> => {
    res.status(410).json({
      error: {
        code: "CHECKOUT_ONLY",
        message:
          "PaymentIntents for client-side card entry are not supported. Use Stripe Checkout Sessions only.",
      },
    });
  });

  /** POST /payments/confirm — capture payment (confirm booking payment). */
  router.post("/confirm", async (req: Request, res: Response): Promise<void> => {
    const validation = validateBody(confirmPaymentBodySchema, req.body);
    if (!validation.success) {
      sendValidationError(res, validation.errors);
      return;
    }
    try {
      const payment = await confirmPayment(validation.data);
      res.json(toPaymentResponse(payment));
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to confirm payment";
      const status =
        message.includes("not found") || message.includes("not in HELD") ? 400 : 500;
      res.status(status).json({ error: { code: "PAYMENT_ERROR", message } });
    }
  });

  /** POST /payments/refund — refund a payment (full or partial). */
  router.post("/refund", async (req: Request, res: Response): Promise<void> => {
    const validation = validateBody(refundPaymentBodySchema, req.body);
    if (!validation.success) {
      sendValidationError(res, validation.errors);
      return;
    }
    try {
      const payment = await refundPayment(validation.data);
      res.json(toPaymentResponse(payment));
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to refund";
      const status =
        message.includes("not found") || message.includes("already refunded") || message.includes("No provider")
          ? 400
          : 500;
      res.status(status).json({ error: { code: "PAYMENT_ERROR", message } });
    }
  });

  /** GET /payments/history — transaction history with optional filters. */
  router.get("/history", async (req: Request, res: Response): Promise<void> => {
    const validation = validateQuery(historyQuerySchema, req.query);
    if (!validation.success) {
      sendValidationError(res, validation.errors);
      return;
    }
    try {
      const result = await getHistory(validation.data);
      res.json(result);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to fetch history" } });
    }
  });

  return router;
}
