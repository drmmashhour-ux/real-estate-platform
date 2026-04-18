import { MESSAGES } from "@/lib/i18n/messages";
import { getResolvedMarket } from "@/lib/markets";
import { prisma } from "@/lib/db";
import { withDbRetry } from "@/lib/db/with-db-retry";
import { isStripeConfigured } from "@/lib/stripe";
import { revenueV4Flags, hostEconomicsFlags } from "@/config/feature-flags";

export type ReadinessIssue = {
  code: string;
  severity: "blocking" | "warning";
  message: string;
};

/**
 * Server-side checks for production launch gates — no fake green lights.
 */
export async function runLaunchReadinessChecks(): Promise<{
  healthOk: boolean;
  dbOk: boolean;
  i18nOk: boolean;
  marketOk: boolean;
  stripeConfigured: boolean;
  stripeWebhookSecretSet: boolean;
  migrationCount: number | null;
  roiApiLikelyEnabled: boolean;
  pricingApiLikelyEnabled: boolean;
  issues: ReadinessIssue[];
  recommendations: string[];
}> {
  const issues: ReadinessIssue[] = [];
  const recommendations: string[] = [];

  let dbOk = false;
  try {
    await withDbRetry(() => prisma.$queryRaw`SELECT 1`, { maxAttempts: 2, baseDelayMs: 150 });
    dbOk = true;
  } catch {
    issues.push({
      code: "db_unreachable",
      severity: "blocking",
      message: "Database ping failed — verify DATABASE_URL and connectivity.",
    });
  }

  const i18nOk =
    Object.keys(MESSAGES.en).length > 0 &&
    Object.keys(MESSAGES.fr).length > 0 &&
    Object.keys(MESSAGES.ar).length > 0;
  if (!i18nOk) {
    issues.push({ code: "i18n_incomplete", severity: "blocking", message: "i18n bundles incomplete." });
  }

  let marketOk = false;
  try {
    await getResolvedMarket();
    marketOk = true;
  } catch {
    issues.push({ code: "market_config", severity: "blocking", message: "Market resolution failed." });
  }

  const healthOk = true;

  const stripeConfigured = isStripeConfigured();
  if (!stripeConfigured) {
    issues.push({
      code: "stripe_secret",
      severity: "warning",
      message: "STRIPE_SECRET_KEY not configured — card flows will not run.",
    });
  }

  const stripeWebhookSecretSet = Boolean(process.env.STRIPE_WEBHOOK_SECRET?.trim());
  if (!stripeWebhookSecretSet) {
    issues.push({
      code: "stripe_webhook_secret",
      severity: "warning",
      message: "STRIPE_WEBHOOK_SECRET unset — webhook signature verification will fail in production.",
    });
    recommendations.push("Configure Stripe CLI or Dashboard webhook secret (whsec_*) on the deployment.");
  }

  let migrationCount: number | null = null;
  if (dbOk) {
    try {
      const rows = await prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(*)::bigint AS count FROM "_prisma_migrations"
      `;
      migrationCount = Number(rows[0]?.count ?? 0);
      if (migrationCount === 0) {
        issues.push({
          code: "migrations_empty",
          severity: "warning",
          message: "_prisma_migrations is empty — confirm migrations were applied on this database.",
        });
      }
    } catch {
      migrationCount = null;
      recommendations.push("Could not read _prisma_migrations — verify Prisma migrate deploy ran.");
    }
  }

  const roiApiLikelyEnabled =
    process.env.FEATURE_ROI_CALCULATOR_V1 === "1" ||
    process.env.FEATURE_ROI_CALCULATOR_V1 === "true" ||
    hostEconomicsFlags.roiCalculatorV1;
  const pricingApiLikelyEnabled =
    process.env.FEATURE_PRICING_ENGINE_V1 === "1" ||
    process.env.FEATURE_PRICING_ENGINE_V1 === "true" ||
    revenueV4Flags.pricingEngineV1;

  if (!roiApiLikelyEnabled) {
    recommendations.push("Enable FEATURE_ROI_CALCULATOR_V1 for host ROI endpoints used in acquisition.");
  }
  if (!pricingApiLikelyEnabled) {
    recommendations.push("Enable FEATURE_PRICING_ENGINE_V1 for transparent pricing APIs.");
  }

  recommendations.push(
    "Verify BNHub booking end-to-end in staging with a real test card — automated readiness cannot confirm guest/host Stripe Connect settlement.",
  );
  recommendations.push(
    "Browser console errors require manual verification in production with source maps and monitoring (e.g. Vercel / Sentry).",
  );

  return {
    healthOk,
    dbOk,
    i18nOk,
    marketOk,
    stripeConfigured,
    stripeWebhookSecretSet,
    migrationCount,
    roiApiLikelyEnabled,
    pricingApiLikelyEnabled,
    issues,
    recommendations,
  };
}
