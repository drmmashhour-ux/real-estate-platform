/**
 * POST /api/mobile/v1/stripe/connect/create-account — Bearer auth; creates Express account for Prisma-linked host.
 */

import { getSupabaseAuthIdFromRequest } from "@/lib/bnhub/getSupabaseAuthIdFromRequest";
import { getBnhubHostListingCountForUser } from "@/lib/bnhub/supabaseHostListings";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { ensureHostExpressAccount } from "@/lib/stripe/hostConnectExpress";
import { getMobileAuthUser } from "@/lib/mobile/mobileAuth";
import { resolvePrismaUserIdForConnect } from "@/lib/mobile/resolvePrismaUserForConnect";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
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

  const rl = checkRateLimit(`stripe:mobile:connect:create:${prismaUserId}`, { windowMs: 60_000, max: 8 });
  if (!rl.allowed) {
    return Response.json(
      { error: "Too many requests. Try again shortly." },
      { status: 429, headers: getRateLimitHeaders(rl) }
    );
  }

  const supaId = await getSupabaseAuthIdFromRequest(request);
  const bnhubCount = supaId ? await getBnhubHostListingCountForUser(supaId) : 0;

  const result = await ensureHostExpressAccount(stripe, prismaUserId, { bnhubSupabaseListingCount: bnhubCount });
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }

  return Response.json({ accountId: result.accountId, created: result.created });
}
