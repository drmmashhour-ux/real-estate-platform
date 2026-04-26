/**
 * GET /api/mobile/v1/stripe/connect/status — Bearer; Stripe Connect readiness for Prisma-linked user.
 */

import { getSupabaseAuthIdFromRequest } from "@/lib/bnhub/getSupabaseAuthIdFromRequest";
import { getBnhubHostListingCountForUser } from "@/lib/bnhub/supabaseHostListings";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { syncHostOnboardingCompleteFromStripe } from "@/lib/stripe/hostConnectExpress";
import { getMobileAuthUser } from "@/lib/mobile/mobileAuth";
import { resolvePrismaUserIdForConnect } from "@/lib/mobile/resolvePrismaUserForConnect";
import {
  estimateHostPayoutableFromSupabase,
  type HostPayoutEstimate,
} from "@/lib/bookings/get-host-payout-estimate";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
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
    return Response.json({
      needsPrismaProfile: true,
      connected: false,
      onboardingComplete: false,
      chargesEnabled: false,
      payoutsEnabled: false,
      detailsSubmitted: false,
      payoutEstimate: null as HostPayoutEstimate | null,
      bnhubListingCount: 0,
    });
  }

  const supaId = await getSupabaseAuthIdFromRequest(request);
  const bnhubListingCount = supaId ? await getBnhubHostListingCountForUser(supaId) : 0;

  let payoutEstimate: HostPayoutEstimate | null = null;
  if (supaId) {
    const est = await estimateHostPayoutableFromSupabase(supaId);
    if ("grossPaid" in est) payoutEstimate = est;
  }

  const user = await prisma.user.findUnique({
    where: { id: prismaUserId },
    select: {
      stripeAccountId: true,
      stripeOnboardingComplete: true,
      stripeChargesEnabled: true,
      stripePayoutsEnabled: true,
    },
  });

  if (!user?.stripeAccountId?.trim()) {
    return Response.json({
      needsPrismaProfile: false,
      connected: false,
      onboardingComplete: false,
      chargesEnabled: false,
      payoutsEnabled: false,
      detailsSubmitted: false,
      accountId: null as string | null,
      payoutEstimate,
      bnhubListingCount,
    });
  }

  const accountId = user.stripeAccountId.trim();

  try {
    const { detailsSubmitted, chargesEnabled, payoutsEnabled } = await syncHostOnboardingCompleteFromStripe(
      stripe,
      prismaUserId,
      accountId
    );

    const fresh = await prisma.user.findUnique({
      where: { id: prismaUserId },
      select: { stripeOnboardingComplete: true },
    });

    return Response.json({
      needsPrismaProfile: false,
      connected: true,
      onboardingComplete: Boolean(fresh?.stripeOnboardingComplete),
      chargesEnabled,
      payoutsEnabled,
      detailsSubmitted,
      accountId,
      payoutEstimate,
      bnhubListingCount,
    });
  } catch (e) {
    console.error("[mobile/stripe/connect/status]", e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Failed to load Stripe account" },
      { status: 400 }
    );
  }
}
