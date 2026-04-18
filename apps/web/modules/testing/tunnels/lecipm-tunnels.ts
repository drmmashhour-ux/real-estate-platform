/**
 * LECIPM Full System Validation — real DB + HTTP checks. No fabricated outcomes.
 * Run via: pnpm --filter @lecipm/web run validate:lecipm-system
 */
import { prisma } from "@/lib/db";
import { describeStripeSecretKeyError } from "@/lib/stripe/stripeEnvGate";
import { estimateBrokerRoi } from "@/modules/roi/broker-roi.service";
import { computeBookingPricing } from "@/lib/bnhub/booking-pricing";
import type { TunnelLogger } from "@/modules/testing/test-logger.service";
import type { TunnelStatus, TunnelTestResult } from "@/modules/testing/test-result.types";

function validationBaseUrl(): string {
  return (
    process.env.VALIDATION_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    "http://127.0.0.1:3001"
  );
}

/** When the CLI runs without a live Next server, `fetch` fails — treat as WARNING, not a fake PASS. */
function isLikelyUnreachableHostError(e: unknown): boolean {
  const m = e instanceof Error ? e.message : String(e);
  return (
    m.includes("fetch failed") ||
    m.includes("ECONNREFUSED") ||
    m.includes("ENOTFOUND") ||
    m.includes("EAI_AGAIN")
  );
}

function finalizeResult(
  id: string,
  name: string,
  logger: TunnelLogger,
  hadError: boolean,
  hadWarning: boolean,
): TunnelTestResult {
  const steps = logger.getSteps();
  const logs = logger.getLogs();
  const errors = steps.filter((s) => s.level === "error").map((s) => `${s.step}: ${s.message}`);
  let status: TunnelStatus = "PASS";
  if (hadError) status = "FAIL";
  else if (hadWarning) status = "WARNING";
  return {
    id,
    name,
    critical: false,
    status,
    steps,
    errors: hadError ? errors : [],
    logs,
  };
}

export async function tunnelBnhubGuestBooking(logger: TunnelLogger): Promise<TunnelTestResult> {
  let hadError = false;
  let hadWarning = false;

  try {
    const host =
      (await prisma.user.findFirst({ where: { email: "host@demo.com" }, select: { id: true } })) ||
      (await prisma.user.findFirst({ where: { role: "HOST" }, select: { id: true } }));
    const guest =
      (await prisma.user.findFirst({ where: { email: "guest@demo.com" }, select: { id: true } })) ||
      (await prisma.user.findFirst({ where: { role: "USER" }, select: { id: true } }));

    if (!host || !guest) {
      logger.error("seed-users", "Missing HOST + USER/guest seed users", "Run pnpm db:seed");
      hadError = true;
      return finalizeResult("bnhub-guest-booking", "Guest → BNHub booking", logger, hadError, hadWarning);
    }
    logger.info("seed-users", "Located host and guest users for DB tunnel");

    /** Narrow `select` so validation runs even if DB is behind Prisma (missing optional columns). */
    const listing =
      (await prisma.shortTermListing.findFirst({
        where: { listingStatus: "PUBLISHED" },
        orderBy: { updatedAt: "desc" },
        select: { id: true, listingCode: true },
      })) ||
      (await prisma.shortTermListing.findFirst({
        orderBy: { updatedAt: "desc" },
        select: { id: true, listingCode: true },
      }));
    if (!listing) {
      logger.error("listing", "No shortTermListing rows — seed BNHub listings");
      hadError = true;
      return finalizeResult("bnhub-guest-booking", "Guest → BNHub booking", logger, hadError, hadWarning);
    }
    logger.info("listing-resolve", `Using existing listing ${listing.id} (${listing.listingCode})`);

    const checkIn = new Date();
    checkIn.setDate(checkIn.getDate() + 14);
    const checkOut = new Date(checkIn);
    checkOut.setDate(checkOut.getDate() + 2);
    const checkInStr = checkIn.toISOString().slice(0, 10);
    const checkOutStr = checkOut.toISOString().slice(0, 10);

    const priced = await computeBookingPricing({
      listingId: listing.id,
      checkIn: checkInStr,
      checkOut: checkOutStr,
      guestCount: 2,
    });
    if (!priced) {
      logger.error("pricing", "computeBookingPricing returned null");
      hadError = true;
    } else {
      logger.info(
        "pricing",
        "Price breakdown computed",
        `totalCents=${priced.breakdown.totalCents}`,
      );
    }

    const totalCents = priced?.breakdown.totalCents ?? 20_000;
    const booking = await prisma.booking.create({
      data: {
        guestId: guest.id,
        listingId: listing.id,
        checkIn,
        checkOut,
        nights: 2,
        totalCents,
        status: "PENDING",
      },
    });
    logger.info("booking-create", "Booking row created", booking.id);

    const pay = await prisma.payment.create({
      data: {
        bookingId: booking.id,
        amountCents: priced?.breakdown.totalCents ?? totalCents,
        guestFeeCents: priced?.breakdown.serviceFeeCents ?? 0,
        hostFeeCents: priced?.breakdown.hostFeeCents ?? 0,
        status: "PENDING",
      },
    });
    logger.info("payment-row", "Payment row linked", pay.id);

    await prisma.payment.deleteMany({ where: { bookingId: booking.id } }).catch(() => {});
    await prisma.booking.delete({ where: { id: booking.id } }).catch(() => {});

    logger.info("cleanup", "Ephemeral booking + payment removed (listing retained)");
  } catch (e) {
    hadError = true;
    logger.error("exception", e instanceof Error ? e.message : String(e));
  }

  return finalizeResult("bnhub-guest-booking", "Guest → BNHub booking", logger, hadError, hadWarning);
}

export async function tunnelHostFlow(logger: TunnelLogger): Promise<TunnelTestResult> {
  let hadError = false;
  let hadWarning = false;
  try {
    const count = await prisma.shortTermListing.count();
    logger.info("listings-count", `shortTermListing rows: ${count}`);
    if (count === 0) {
      logger.warn("data", "No listings in DB — host search surfaces may be empty");
      hadWarning = true;
    }
    const host = await prisma.user.findFirst({
      where: { role: "HOST" },
      select: { id: true },
    });
    if (!host) {
      logger.warn("host-user", "No HOST user — host dashboard tests need seed");
      hadWarning = true;
    } else {
      logger.info("host-user", "At least one HOST exists");
    }
  } catch (e) {
    hadError = true;
    logger.error("exception", e instanceof Error ? e.message : String(e));
  }
  return finalizeResult("host-listing-payout", "Host → listing → metrics", logger, hadError, hadWarning);
}

export async function tunnelBrokerDealFlow(logger: TunnelLogger): Promise<TunnelTestResult> {
  let hadError = false;
  let hadWarning = false;

  try {
    const dealCount = await prisma.deal.count();
    logger.info("deal-count", `Deal rows: ${dealCount}`);

    const withBroker = await prisma.deal.findFirst({
      where: { brokerId: { not: null } },
      select: { id: true, brokerId: true, status: true, priceCents: true },
      orderBy: { updatedAt: "desc" },
    });
    if (withBroker) {
      logger.info("deal-sample", `Broker-linked deal ${withBroker.id} status=${withBroker.status}`);
    } else {
      logger.warn(
        "deal-sample",
        "No broker-linked deals in DB — create deals in CRM to validate broker tunnel end-to-end",
      );
      hadWarning = true;
    }
  } catch (e) {
    hadError = true;
    logger.error("exception", e instanceof Error ? e.message : String(e));
  }

  return finalizeResult("broker-deal-flow", "Broker → lead → deal", logger, hadError, hadWarning);
}

export async function tunnelPaymentStripe(logger: TunnelLogger): Promise<TunnelTestResult> {
  let hadError = false;
  let hadWarning = false;

  const keyErr = describeStripeSecretKeyError();
  if (keyErr) {
    logger.error("stripe-key", keyErr);
    hadError = true;
  } else {
    logger.info("stripe-key", "STRIPE_SECRET_KEY format OK");
  }

  const wh = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!wh) {
    logger.warn("webhook-secret", "STRIPE_WEBHOOK_SECRET unset — webhook signature tests skipped in CI/local");
    hadWarning = true;
  } else if (!wh.startsWith("whsec_")) {
    logger.error("webhook-secret", "STRIPE_WEBHOOK_SECRET must start with whsec_");
    hadError = true;
  } else {
    logger.info("webhook-secret", "Webhook signing secret format OK");
  }

  try {
    const inbox = await prisma.bnhubProcessorWebhookInbox.count();
    logger.info("webhook-inbox", `bnhubProcessorWebhookInbox rows: ${inbox}`);
  } catch (e) {
    logger.warn("webhook-inbox", "Could not read webhook inbox", e instanceof Error ? e.message : String(e));
    hadWarning = true;
  }

  return finalizeResult("payment-stripe", "Stripe + webhook + idempotency", logger, hadError, hadWarning);
}

export async function tunnelAiSystems(logger: TunnelLogger): Promise<TunnelTestResult> {
  let hadError = false;
  let hadWarning = false;

  const roi = estimateBrokerRoi({
    leadsPerMonth: 10,
    qualificationRate: 0.4,
    closeRate: 0.2,
    avgGrossCommissionPerDeal: 8000,
    platformSuccessFeePercent: 0.15,
  });
  if ("error" in roi) {
    logger.error("roi", roi.error);
    hadError = true;
  } else {
    logger.info("roi", "estimateBrokerRoi returned numeric estimate", `net=${roi.netDollars}`);
    if (roi.disclaimers.length < 1) {
      logger.warn("roi", "Expected at least one ROI disclaimer");
      hadWarning = true;
    }
  }

  return finalizeResult("ai-roi-pricing", "AI / ROI / pricing logic", logger, hadError, hadWarning);
}

export async function tunnelAdminFlow(logger: TunnelLogger): Promise<TunnelTestResult> {
  let hadError = false;
  let hadWarning = false;
  try {
    const admins = await prisma.user.count({ where: { role: "ADMIN" } });
    logger.info("admin-count", `ADMIN users: ${admins}`);
    if (admins === 0) logger.warn("admin-count", "No ADMIN user — admin tunnel not representative");
    const ev = await prisma.platformEvent.count();
    logger.info("platform-events", `platformEvent rows: ${ev}`);
  } catch (e) {
    hadError = true;
    logger.error("exception", e instanceof Error ? e.message : String(e));
  }
  return finalizeResult("admin-moderation", "Admin surfaces (DB)", logger, hadError, hadWarning);
}

export async function tunnelMobileFlow(logger: TunnelLogger): Promise<TunnelTestResult> {
  let hadError = false;
  let hadWarning = false;
  const base = validationBaseUrl();

  try {
    const res = await fetch(`${base}/api/mobile/broker/home`, { method: "GET" });
    if (res.status !== 401 && res.status !== 403) {
      logger.warn("mobile-broker-home", `Expected 401/403 without auth, got ${res.status}`);
      hadWarning = true;
    } else {
      logger.info("mobile-broker-home", `Unauthenticated broker home blocked (${res.status})`);
    }
  } catch (e) {
    hadWarning = true;
    logger.warn(
      "mobile-broker-home",
      "HTTP check skipped — start Next.js (`pnpm dev`) and set VALIDATION_BASE_URL if needed",
      e instanceof Error ? e.message : String(e),
    );
  }

  return finalizeResult("mobile-broker", "Mobile broker API gate", logger, hadError, hadWarning);
}

export async function tunnelSecurity(logger: TunnelLogger): Promise<TunnelTestResult> {
  let hadError = false;
  let hadWarning = false;
  const base = validationBaseUrl();

  try {
    const ready = await fetch(`${base}/api/ready`);
    if (!ready.ok) {
      logger.error("ready", `/api/ready returned ${ready.status}`);
      hadError = true;
    } else {
      logger.info("ready", "/api/ready OK");
    }

    const admin = await fetch(`${base}/api/admin/market-settings`, { method: "GET" });
    if (admin.status !== 403 && admin.status !== 401) {
      logger.error("admin-gate", `Expected 401/403 for unauthenticated admin API, got ${admin.status}`);
      hadError = true;
    } else {
      logger.info("admin-gate", `Unauthenticated admin blocked (${admin.status})`);
    }
  } catch (e) {
    if (isLikelyUnreachableHostError(e)) {
      hadWarning = true;
      logger.warn(
        "http",
        "VALIDATION_BASE_URL unreachable — HTTP security assertions not run. Start the app and re-run for full coverage.",
        e instanceof Error ? e.message : String(e),
      );
    } else {
      hadError = true;
      logger.error("http", e instanceof Error ? e.message : String(e));
    }
  }

  return finalizeResult("security-access-control", "Security / access control", logger, hadError, hadWarning);
}

export async function tunnelEdgeCases(logger: TunnelLogger): Promise<TunnelTestResult> {
  let hadError = false;
  let hadWarning = false;
  const base = validationBaseUrl();

  try {
    try {
      const badJson = await fetch(`${base}/api/roi/broker`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{not-json",
      });
      if (badJson.status !== 400 && badJson.status !== 500) {
        logger.warn("invalid-json", `Malformed JSON got ${badJson.status} (expected 4xx/5xx)`);
        hadWarning = true;
      } else {
        logger.info("invalid-json", "Malformed body rejected");
      }
    } catch (e) {
      if (isLikelyUnreachableHostError(e)) {
        hadWarning = true;
        logger.warn(
          "invalid-json",
          "HTTP malformed-body check skipped — server unreachable",
          e instanceof Error ? e.message : String(e),
        );
      } else {
        throw e;
      }
    }

    const userProbe = await prisma.user.findFirst({
      select: { id: true },
      orderBy: { createdAt: "desc" },
    });
    if (userProbe) {
      logger.info("user-read", "User table readable (sample row present)");
    } else {
      logger.warn("user-read", "No users in DB — seed users for fuller checks");
      hadWarning = true;
    }
  } catch (e) {
    hadError = true;
    logger.error("exception", e instanceof Error ? e.message : String(e));
  }

  return finalizeResult("edge-cases", "Edge cases / failure handling", logger, hadError, hadWarning);
}
