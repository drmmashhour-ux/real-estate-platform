/**
 * POST /api/payments/orchestrated/session — hosted checkout via orchestration (Stripe primary, Clover fallback).
 * Auth: session cookie; `userId` in body is ignored — caller is always the authenticated user.
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { createPaymentSession } from "@/lib/payments/orchestrator";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { logError } from "@/lib/logger";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  paymentType: z.enum(["booking", "subscription", "listing_upgrade", "office_payment"]),
  bookingId: z.string().optional().nullable(),
  listingId: z.string().optional().nullable(),
  amountCents: z.number().int().positive(),
  currency: z.string().min(3).max(8).optional(),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
  description: z.string().max(500).optional(),
  metadata: z.record(z.string(), z.string()).optional(),
  workspaceId: z.string().optional().nullable(),
  planCode: z.string().optional().nullable(),
  priceId: z.string().optional().nullable(),
  userEmail: z.string().email().optional().nullable(),
  stripeConnect: z
    .object({
      destinationAccountId: z.string().min(1),
      applicationFeeAmount: z.number().int().nonnegative(),
      bnhubPlatformFeeCents: z.number().int().optional(),
      bnhubHostPayoutCents: z.number().int().optional(),
    })
    .optional(),
});

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";
  const ipLimit = checkRateLimit(`payments:orchestrated:ip:${ip}`, { windowMs: 60 * 1000, max: 40 });
  if (!ipLimit.allowed) {
    return Response.json(
      { error: "Too many requests from this network." },
      { status: 429, headers: getRateLimitHeaders(ipLimit) }
    );
  }

  const userId = await getGuestId();
  if (!userId) {
    return Response.json({ error: "Authentication required" }, { status: 401 });
  }

  const userLimit = checkRateLimit(`payments:orchestrated:user:${userId}`, { windowMs: 60 * 1000, max: 20 });
  if (!userLimit.allowed) {
    return Response.json(
      { error: "Too many checkout requests. Try again shortly." },
      { status: 429, headers: getRateLimitHeaders(userLimit) }
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }

  const body = parsed.data;
  let userEmail = body.userEmail?.trim() || null;
  if (body.paymentType === "subscription" && !userEmail) {
    try {
      const u = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });
      userEmail = u?.email?.trim() ?? null;
    } catch (e) {
      logError("orchestrated session: load user email failed", e);
    }
  }

  const result = await createPaymentSession({
    paymentType: body.paymentType,
    userId,
    userEmail,
    bookingId: body.bookingId ?? undefined,
    listingId: body.listingId ?? undefined,
    amountCents: body.amountCents,
    currency: body.currency,
    successUrl: body.successUrl,
    cancelUrl: body.cancelUrl,
    description: body.description,
    metadata: body.metadata,
    workspaceId: body.workspaceId ?? undefined,
    planCode: body.planCode ?? undefined,
    priceId: body.priceId ?? undefined,
    stripeConnect: body.stripeConnect,
  });

  if (!result.ok) {
    return Response.json(
      {
        error: result.error,
        orchestratedPaymentId: result.orchestratedPaymentId,
      },
      { status: 502 }
    );
  }

  return Response.json({
    url: result.url,
    provider: result.provider,
    orchestratedPaymentId: result.orchestratedPaymentId,
    providerPaymentId: result.providerPaymentId,
  });
}
