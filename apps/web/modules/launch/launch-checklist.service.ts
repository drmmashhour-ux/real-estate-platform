import { validateLaunchReadiness } from "./readiness-validator.service";
import { getSystemHealthSnapshot } from "./system-health.service";

export type LaunchChecklistPayload = {
  status: "ready" | "not_ready";
  issues: { code: string; severity: string; message: string }[];
  recommendations: string[];
  checklist: {
    apiHealth: boolean;
    apiReady: boolean;
    stripeWebhookSecret: boolean;
    stripeSecret: boolean;
    databaseMigrationsCounted: boolean;
    migrationCount: number | null;
  };
  health: Awaited<ReturnType<typeof getSystemHealthSnapshot>>;
  generatedAt: string;
};

/**
 * Full launch checklist for `/api/launch/status` — complements manual QA (booking E2E, browser console).
 */
export async function buildLaunchChecklist(): Promise<LaunchChecklistPayload> {
  const readiness = await validateLaunchReadiness();
  const health = await getSystemHealthSnapshot();

  const checklist = {
    apiHealth: readiness.checks.healthOk,
    apiReady: readiness.checks.dbOk && readiness.checks.i18nOk && readiness.checks.marketOk,
    stripeWebhookSecret: readiness.checks.stripeWebhookSecretSet,
    stripeSecret: readiness.checks.stripeConfigured,
    databaseMigrationsCounted: readiness.checks.migrationCount != null,
    migrationCount: readiness.checks.migrationCount,
  };

  return {
    status: readiness.status,
    issues: readiness.issues,
    recommendations: readiness.recommendations,
    checklist,
    health,
    generatedAt: new Date().toISOString(),
  };
}
