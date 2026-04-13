import type { E2EFailureType } from "./types";

export interface SuggestedFixPlan {
  likelyRootCause: string;
  suggestedFixZones: string[];
  filesLikelyInvolved: string[];
  safeRerunConditions: string;
}

export function suggestFixForType(type: E2EFailureType, errorSnippet: string): SuggestedFixPlan {
  const snip = errorSnippet.slice(0, 240);

  switch (type) {
    case "missing_translation":
      return {
        likelyRootCause: `Copy rendered as raw keys or wrong namespace (${snip})`,
        suggestedFixZones: ["locale JSON bundles", "flattening / nested key resolution", "fallback to English", "next-intl or app i18n provider"],
        filesLikelyInvolved: [
          "apps/web/messages/*.json",
          "apps/web/lib/i18n/",
          "apps/web/app/**/layout.tsx",
        ],
        safeRerunConditions: "After verifying keys exist for en/fr/ar and default locale is en.",
      };
    case "rtl_layout":
      return {
        likelyRootCause: `RTL layout or dir attribute drift (${snip})`,
        suggestedFixZones: ["html dir + lang", "logical CSS (ms/me/ps/pe)", "component padding symmetry", "overflow on cards/tables"],
        filesLikelyInvolved: ["apps/web/app/layout.tsx", "apps/web/lib/i18n/", "apps/web/app/globals.css"],
        safeRerunConditions: "After visual check on /bnhub/stays and listing detail with mi_locale=ar.",
      };
    case "stripe_checkout":
      return {
        likelyRootCause: `Checkout session creation or metadata failed (${snip})`,
        suggestedFixZones: ["Stripe keys", "checkout route validation", "booking ↔ quote linkage", "Connect destination / fees"],
        filesLikelyInvolved: [
          "apps/web/app/api/stripe/checkout/route.ts",
          "apps/web/modules/bnhub-payments/",
          "apps/web/lib/stripe/",
        ],
        safeRerunConditions: "With sk_test_* and valid seeded listing; retry after fixing env or quote logic.",
      };
    case "stripe_webhook":
      return {
        likelyRootCause: `Webhook verified but booking/payment state did not converge (${snip})`,
        suggestedFixZones: ["webhook idempotency", "metadata bookingId", "payment row upsert", "BNHUB reservation payment"],
        filesLikelyInvolved: [
          "apps/web/app/api/stripe/webhook/route.ts",
          "apps/web/lib/bnhub/booking.ts",
          "apps/web/prisma/schema.prisma (Payment / BnhubReservationPayment)",
        ],
        safeRerunConditions: "Use fresh booking; confirm STRIPE_WEBHOOK_SECRET matches dashboard; check growth_stripe_webhook_logs.",
      };
    case "manual_payment":
      return {
        likelyRootCause: `Manual settlement path rejected or stuck (${snip})`,
        suggestedFixZones: ["market flags (Syria)", "booking transition rules", "PATCH manual-payment auth", "audit BookingManualPaymentEvent"],
        filesLikelyInvolved: [
          "apps/web/app/api/bookings/manual-payment/route.ts",
          "apps/web/lib/bookings/",
          "apps/web/app/admin/bookings-ops/",
        ],
        safeRerunConditions: "New booking in Syria mode after market settings restored; admin/host roles correct.",
      };
    case "permission_error":
      return {
        likelyRootCause: `Actor lacks permission for the operation (${snip})`,
        suggestedFixZones: ["session / role checks", "admin surface guards", "host vs guest API ownership"],
        filesLikelyInvolved: ["apps/web/lib/auth/", "apps/web/app/api/**/route.ts"],
        safeRerunConditions: "Login as correct persona (E2E_ADMIN_*, host@demo.com, guest@demo.com).",
      };
    case "market_resolution":
      return {
        likelyRootCause: `Market-derived CTAs or payment mode mismatch (${snip})`,
        suggestedFixZones: ["getResolvedMarket", "platform_market_launch_settings", "BNHUB booking create branching"],
        filesLikelyInvolved: [
          "apps/web/lib/markets/",
          "apps/web/app/api/admin/market-settings/route.ts",
          "apps/web/app/api/bnhub/booking/create/route.ts",
        ],
        safeRerunConditions: "Admin restores prior market snapshot; clear cookies between Syria/global runs.",
      };
    case "booking_transition":
      return {
        likelyRootCause: `Invalid or incomplete booking state machine step (${snip})`,
        suggestedFixZones: ["central transition helper", "market-aware payment mode", "approve/cancel endpoints"],
        filesLikelyInvolved: ["apps/web/lib/bnhub/booking.ts", "apps/web/app/api/bnhub/bookings/"],
        safeRerunConditions: "Fresh booking with dates not colliding; host approval order respected.",
      };
    case "db_consistency":
      return {
        likelyRootCause: `Database state does not match API expectations (${snip})`,
        suggestedFixZones: ["migrations", "unique constraints", "transaction boundaries"],
        filesLikelyInvolved: ["apps/web/prisma/schema.prisma", "apps/web/lib/db.ts"],
        safeRerunConditions: "After prisma migrate + seed; remove orphaned rows if any.",
      };
    case "ai_locale_mismatch":
      return {
        likelyRootCause: `AI or autopilot output not aligned with user UI locale (${snip})`,
        suggestedFixZones: ["getUserUiLocaleCode", "host-autopilot run", "recommendation persistence"],
        filesLikelyInvolved: [
          "apps/web/app/api/ai/host-autopilot/run/route.ts",
          "apps/web/app/api/ai/recommendations/route.ts",
          "apps/web/lib/i18n/user-ui-locale.ts",
        ],
        safeRerunConditions: "PATCH /api/me/ui-locale then re-run autopilot; verify FR/AR strings.",
      };
    case "notification_error":
      return {
        likelyRootCause: `Outbound notification pipeline failed (${snip})`,
        suggestedFixZones: ["email provider", "notification enqueue", "template locale"],
        filesLikelyInvolved: ["apps/web/lib/notifications/", "apps/web/prisma/schema.prisma (Notification)"],
        safeRerunConditions: "After provider credentials valid; check Notification + NotificationEvent tables.",
      };
    case "api_error":
      return {
        likelyRootCause: `HTTP 4xx/5xx from application route (${snip})`,
        suggestedFixZones: ["route handler validation", "upstream Prisma errors", "rate limits"],
        filesLikelyInvolved: ["apps/web/app/api/"],
        safeRerunConditions: "Fix handler; rerun single scenario.",
      };
    case "ui_localization":
      return {
        likelyRootCause: `Locale-specific UI assertion failed (${snip})`,
        suggestedFixZones: ["cookie mi_locale", "server vs client locale", "marketing vs dashboard bundles"],
        filesLikelyInvolved: ["apps/web/lib/i18n/", "apps/web/app/(marketing)/"],
        safeRerunConditions: "Set locale cookie; hard refresh; rerun locale scenarios.",
      };
    case "infra_blocked":
      return {
        likelyRootCause: "Application server unreachable or required secrets missing (not a product logic bug).",
        suggestedFixZones: ["PLAYWRIGHT_BASE_URL", "next dev port", "STRIPE_* / E2E_ADMIN_* env"],
        filesLikelyInvolved: ["apps/web/playwright.config.cjs", ".env"],
        safeRerunConditions: "Start Next on configured port; export required env; rerun full suite.",
      };
    default:
      return {
        likelyRootCause: `Unclassified failure (${snip})`,
        suggestedFixZones: ["Review failed step logs", "Reproduce manually", "Add finer logging"],
        filesLikelyInvolved: ["apps/web/e2e/scenarios/", "apps/web/app/api/"],
        safeRerunConditions: "Isolate with single scenario Playwright run after fix.",
      };
  }
}
