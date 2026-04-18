/**
 * Crash-safe product + live-debug analytics → `user_events` / `error_events`.
 * Never throws to callers. Set LIVE_DEBUG_MODE=1 for verbose server logs.
 */
import type { Prisma, UserEventType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { logError, logInfo } from "@/lib/logger";

export function isLiveDebugMode(): boolean {
  return process.env.LIVE_DEBUG_MODE === "1";
}

export type LiveDebugMetadata = Record<string, unknown> & {
  listingId?: string;
  city?: string;
  price?: number;
  step?: string;
  source?: "demo" | "real";
};

const EVENT_MAP: Record<string, UserEventType> = {
  signup: "SIGNUP",
  user_signup: "SIGNUP",
  login: "LOGIN",
  user_login: "LOGIN",
  listing_view: "LISTING_VIEW",
  property_viewed: "LISTING_VIEW",
  favorite: "FAVORITE",
  inquiry_sent: "INQUIRY",
  generate_lead: "INQUIRY",
  booking_started: "BOOKING_START",
  /** BNHub stay paid / confirmed — same product milestone as `payment_success`. */
  booking_completed: "PAYMENT_SUCCESS",
  /** Client `checkout` — same milestone as `checkout_started`. */
  checkout: "CHECKOUT_START",
  checkout_started: "CHECKOUT_START",
  /** Funnel label; use `metadata.rawEventType` = landing_view when ingested via track(). */
  landing_view: "VISIT_PAGE",
  payment_success: "PAYMENT_SUCCESS",
  payment_failed: "PAYMENT_FAILED",
  stripe_webhook: "STRIPE_WEBHOOK",
  search_performed: "SEARCH_PERFORMED",
  message_sent: "MESSAGE_SENT",
  ai_reply_sent: "AI_REPLY_SENT",
};

function withSource(meta: Record<string, unknown>): Record<string, unknown> {
  const demo = process.env.DEMO_MODE_ENABLED === "1";
  if (meta.source === "demo" || meta.source === "real") return { ...meta };
  return { ...meta, source: demo ? "demo" : "real" };
}

/**
 * Persist a funnel event. Unknown `eventType` strings are stored as VISIT_PAGE with `rawEventType`.
 */
export async function trackEvent(
  eventType: string,
  metadata: Record<string, unknown> = {},
  opts?: { userId?: string | null; sessionId?: string | null }
): Promise<void> {
  try {
    const meta = withSource(metadata);
    const mapped = EVENT_MAP[eventType];
    if (!mapped) {
      await prisma.userEvent.create({
        data: {
          eventType: "VISIT_PAGE",
          metadata: { rawEventType: eventType, ...meta } as Prisma.InputJsonValue,
          userId: opts?.userId ?? undefined,
          sessionId: opts?.sessionId ?? undefined,
        },
      });
    } else {
      await prisma.userEvent.create({
        data: {
          eventType: mapped,
          metadata: meta as Prisma.InputJsonValue,
          userId: opts?.userId ?? undefined,
          sessionId: opts?.sessionId ?? undefined,
        },
      });
    }
    if (isLiveDebugMode()) {
      logInfo(`[live-debug] user_event ${eventType}`, { userId: opts?.userId ?? null });
    }
  } catch (e) {
    logError("eventTracker: persist user_event failed", e);
  }
}

export async function trackErrorEvent(args: {
  errorType: string;
  message: string;
  stack?: string | null;
  userId?: string | null;
  route?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    const stack =
      args.stack && args.stack.length > 12_000 ? `${args.stack.slice(0, 12_000)}…` : args.stack ?? undefined;
    await prisma.errorEvent.create({
      data: {
        errorType: args.errorType.slice(0, 64),
        message: args.message.slice(0, 50_000),
        stack,
        userId: args.userId ?? undefined,
        route: args.route?.slice(0, 512),
        metadata: args.metadata as Prisma.InputJsonValue | undefined,
      },
    });
    if (isLiveDebugMode()) {
      logInfo(`[live-debug] error_event ${args.errorType}`, { route: args.route ?? null, userId: args.userId ?? null });
    }
  } catch (e) {
    logError("eventTracker: persist error_event failed", e);
  }
}

export function logBusinessMilestone(
  tag: "BOOKING CREATED" | "INQUIRY CREATED" | "PAYMENT SUCCESS" | "PAYMENT FAILED" | "AI REPLY SENT",
  meta?: Record<string, unknown>
): void {
  logInfo(`[LECIPM] ${tag}`, meta ?? {});
}
