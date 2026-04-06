import { prisma } from "@/lib/db";
import { getSupabaseServiceForGuestBookings } from "@/lib/stripe/guestSupabaseBooking";
import { isStripeConfigured } from "@/lib/stripe";

export const SOFT_LAUNCH_MIN_LISTINGS_DEFAULT = 10;

export type SoftLaunchStatus = {
  ok: boolean;
  ready: boolean;
  softLaunchReady: boolean;
  listingCount: number;
  minListingsRecommended: number;
  sampleQualityIssues: number;
  checks: {
    database: boolean;
    stripe: boolean;
    stripeWebhookSecret: boolean;
    supabaseServiceRole: boolean;
    listingInventory: boolean;
  };
  warnings: string[];
  errors: string[];
  time: string;
};

export async function getSoftLaunchStatus(): Promise<SoftLaunchStatus> {
  const warnings: string[] = [];
  const errors: string[] = [];

  let dbOk = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbOk = true;
  } catch {
    errors.push("database_unreachable");
  }

  const stripeOk = isStripeConfigured();
  if (!stripeOk) {
    errors.push("stripe_not_configured");
  }

  const webhookSecret = Boolean(process.env.STRIPE_WEBHOOK_SECRET?.trim());
  if (!webhookSecret) {
    warnings.push("stripe_webhook_secret_missing_booking_status_will_not_update");
  }

  const sb = getSupabaseServiceForGuestBookings();
  const supabaseOk = Boolean(sb);
  if (!supabaseOk) {
    errors.push("supabase_guest_bookings_not_configured");
  }

  let listingCount = 0;
  let listingsWithGaps = 0;
  if (sb) {
    const { count, error } = await sb.from("listings").select("id", { count: "exact", head: true });
    if (error) {
      warnings.push(`supabase_listing_count_failed:${error.message}`);
    } else {
      listingCount = typeof count === "number" ? count : 0;
    }

    const { data: sample } = await sb
      .from("listings")
      .select("id, price_per_night, description, cover_image_url")
      .limit(30);

    for (const row of sample ?? []) {
      const r = row as {
        price_per_night?: unknown;
        description?: unknown;
        cover_image_url?: unknown;
      };
      const price = Number(r.price_per_night);
      const desc = typeof r.description === "string" ? r.description.trim() : "";
      const img = typeof r.cover_image_url === "string" ? r.cover_image_url.trim() : "";
      if (!Number.isFinite(price) || price <= 0 || desc.length < 20 || !img.startsWith("http")) {
        listingsWithGaps += 1;
      }
    }
  }

  const minListings = Math.max(
    1,
    Math.min(
      100,
      Number(process.env.SOFT_LAUNCH_MIN_LISTINGS ?? SOFT_LAUNCH_MIN_LISTINGS_DEFAULT) ||
        SOFT_LAUNCH_MIN_LISTINGS_DEFAULT
    )
  );

  if (listingCount < minListings) {
    warnings.push(`listing_count_below_recommended:${listingCount}<${minListings}`);
  }

  if (listingsWithGaps > 0) {
    warnings.push(`sample_listings_missing_price_description_or_cover:${listingsWithGaps}`);
  }

  const identityMin = process.env.BNHUB_BOOKING_IDENTITY_VERIFICATION_MIN_TOTAL_USD?.trim();
  if (identityMin && Number(identityMin) > 0) {
    warnings.push("identity_gate_may_block_anonymous_bookings_set_min_usd_0_for_simple_soft_launch");
  }

  const ready = dbOk && stripeOk && supabaseOk;
  const softLaunchReady =
    ready && webhookSecret && listingCount >= minListings && listingsWithGaps === 0;

  return {
    ok: ready,
    ready,
    softLaunchReady,
    listingCount,
    minListingsRecommended: minListings,
    sampleQualityIssues: listingsWithGaps,
    checks: {
      database: dbOk,
      stripe: stripeOk,
      stripeWebhookSecret: webhookSecret,
      supabaseServiceRole: supabaseOk,
      listingInventory: listingCount >= minListings,
    },
    warnings,
    errors,
    time: new Date().toISOString(),
  };
}
