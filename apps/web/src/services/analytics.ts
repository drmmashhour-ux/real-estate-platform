import type { UserEventType } from "@prisma/client";
import { prisma } from "@/lib/db";

/** External / product event names → Prisma `UserEventType`. */
const EVENT_MAP: Record<string, UserEventType> = {
  signup: "SIGNUP",
  login: "LOGIN",
  listing_view: "LISTING_VIEW",
  favorite: "FAVORITE",
  inquiry_sent: "INQUIRY",
  generate_lead: "INQUIRY",
  booking_started: "BOOKING_START",
  checkout_started: "CHECKOUT_START",
  payment_success: "PAYMENT_SUCCESS",
  payment_failed: "PAYMENT_FAILED",
  stripe_webhook: "STRIPE_WEBHOOK",
};

export type TrackEventInput = {
  eventType: string;
  metadata?: Record<string, unknown>;
  userId?: string | null;
  sessionId?: string | null;
};

/**
 * Growth analytics — persists to Postgres `user_events` (Supabase-compatible when DB is Supabase).
 */
export async function trackEvent(
  eventType: string,
  metadata: Record<string, unknown> = {},
  opts?: { userId?: string | null; sessionId?: string | null }
): Promise<void> {
  const mapped = EVENT_MAP[eventType];
  if (!mapped) {
    await prisma.userEvent.create({
      data: {
        eventType: "VISIT_PAGE",
        metadata: { rawEventType: eventType, ...metadata } as object,
        userId: opts?.userId ?? undefined,
        sessionId: opts?.sessionId ?? undefined,
      },
    });
    return;
  }

  await prisma.userEvent.create({
    data: {
      eventType: mapped,
      metadata: metadata as object,
      userId: opts?.userId ?? undefined,
      sessionId: opts?.sessionId ?? undefined,
    },
  });
}
