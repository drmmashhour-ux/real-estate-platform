/**
 * POST /api/mobile/v1/stripe/connect/onboarding-link — Bearer; returns Stripe Account Link URL (open in browser).
 * Optional JSON: { returnPath?: string, refreshPath?: string } (paths on app origin, default web dashboard).
 */

import { getSupabaseAuthIdFromRequest } from "@/lib/bnhub/getSupabaseAuthIdFromRequest";
import { getBnhubHostListingCountForUser } from "@/lib/bnhub/supabaseHostListings";
import { prisma } from "@repo/db";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { stripeAppBaseUrl } from "@/lib/stripe/app-base-url";
import { createHostAccountOnboardingLink, isBnhubHostConnectEligible } from "@/lib/stripe/hostConnectExpress";
import type { NextRequest } from "next/server";
import { getMobileAuthUser } from "@/lib/mobile/mobileAuth";
import { resolvePrismaUserIdForConnect } from "@/lib/mobile/resolvePrismaUserForConnect";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!isStripeConfigured()) {
    return Response.json({ error: "Stripe is not configured" }, { status: 503 });
  }
  const stripe = getStripe();
  if (!stripe) {
    return Response.json({ error: "Stripe is not configured" }, { status: 503 });
  }

  const auth = await getMobileAuthUser(request);
  if (!auth) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const prismaUserId = await resolvePrismaUserIdForConnect(auth);
  if (!prismaUserId) {
    return Response.json(
      {
        error:
          "No LECIPM profile linked to this sign-in. Use the same email as your web account or contact support.",
        code: "NO_PRISMA_PROFILE",
      },
      { status: 403 }
    );
  }

  const rl = checkRateLimit(`stripe:mobile:connect:link:${prismaUserId}`, { windowMs: 60_000, max: 10 });
  if (!rl.allowed) {
    return Response.json(
      { error: "Too many link requests. Try again shortly." },
      { status: 429, headers: getRateLimitHeaders(rl) }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: prismaUserId },
    select: { stripeAccountId: true, role: true, _count: { select: { shortTermListings: true } } },
  });
  if (!user?.stripeAccountId?.trim()) {
    return Response.json(
      { error: "Create a connected account first (POST …/create-account).", code: "NO_ACCOUNT" },
      { status: 400 }
    );
  }

  const supaId = await getSupabaseAuthIdFromRequest(request);
  const bnhubCount = supaId ? await getBnhubHostListingCountForUser(supaId) : 0;
  if (!isBnhubHostConnectEligible(user.role, user._count.shortTermListings, bnhubCount)) {
    return Response.json({ error: "Not allowed" }, { status: 403 });
  }

  let returnPath = "/dashboard/stripe/success";
  let refreshPath = "/dashboard/stripe/refresh";
  try {
    const body = (await request.json().catch(() => ({}))) as {
      returnPath?: string;
      refreshPath?: string;
    };
    if (typeof body.returnPath === "string" && body.returnPath.startsWith("/")) {
      returnPath = body.returnPath;
    }
    if (typeof body.refreshPath === "string" && body.refreshPath.startsWith("/")) {
      refreshPath = body.refreshPath;
    }
  } catch {
    /* use defaults */
  }

  const base = stripeAppBaseUrl(request);
  const link = await createHostAccountOnboardingLink(stripe, user.stripeAccountId.trim(), base, {
    returnPath,
    refreshPath,
  });
  if (!link.ok) {
    return Response.json({ error: link.error }, { status: link.status });
  }

  return Response.json({ url: link.url });
}
