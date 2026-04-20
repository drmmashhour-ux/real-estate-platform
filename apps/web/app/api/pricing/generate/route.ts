import type { NextRequest } from "next/server";
import {
  generatePricing,
  generatePricingForEnabledListings,
} from "@/modules/pricing/bnhub-dynamic-pricing-suggestions.service";

export const dynamic = "force-dynamic";

function authorizeCron(request: NextRequest): boolean {
  if (process.env.VERCEL === "1" && request.headers.get("x-vercel-cron") === "1") {
    return true;
  }
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const auth = request.headers.get("authorization") ?? "";
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (bearer === secret) return true;
  const q = request.nextUrl.searchParams.get("secret")?.trim();
  return q === secret;
}

async function parseListingId(request: NextRequest): Promise<string | undefined> {
  const ct = request.headers.get("content-type") ?? "";
  if (!ct.includes("application/json")) return undefined;
  try {
    const json = (await request.json()) as { listingId?: string };
    return typeof json.listingId === "string" && json.listingId.trim() ? json.listingId.trim() : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Batch-regenerate nightly **suggestions** for BNHub listings (never updates published prices).
 * Requires `Authorization: Bearer $CRON_SECRET` — same pattern as `/api/calendar/ics/sync-all`.
 *
 * POST JSON body (optional): `{ listingId?: string }` — when set, only that listing.
 *
 * Cron: same auth as other batch routes — `Authorization: Bearer $CRON_SECRET` or `GET ?secret=$CRON_SECRET`.
 */
export async function POST(request: NextRequest) {
  if (!authorizeCron(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const listingId = await parseListingId(request);

  if (listingId) {
    const rows = await generatePricing(listingId);
    return Response.json({
      success: true,
      listingId,
      suggestions: rows?.length ?? 0,
    });
  }

  const summary = await generatePricingForEnabledListings();
  return Response.json({
    success: true,
    ...summary,
  });
}

/** Alias for cron schedulers that use GET (e.g. legacy `curl` without JSON body). */
export async function GET(request: NextRequest) {
  if (!authorizeCron(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const summary = await generatePricingForEnabledListings();
  return Response.json({
    success: true,
    ...summary,
  });
}
