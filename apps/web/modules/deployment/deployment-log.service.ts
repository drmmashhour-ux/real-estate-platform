/**
 * LECIPM Safe Deployment v1 — structured deployment audit trail.
 * Emits JSON lines (log drains) and best-effort durable `PlatformEvent` rows.
 */
import { recordPlatformEvent } from "@/lib/observability";
import { logInfo } from "@/lib/logger";

export type DeploymentLogInput = {
  deploymentId?: string | null;
  /** Git SHA or Vercel deployment id segment */
  gitCommit?: string | null;
  /** CI actor, email, or `vercel` — never store secrets */
  triggeredBy?: string | null;
  success: boolean;
  /** App version from package or release tag */
  version?: string | null;
  /** e.g. predeploy | postdeploy | vercel_build */
  phase: string;
  detail?: string;
  meta?: Record<string, unknown>;
};

export async function logDeploymentEvent(input: DeploymentLogInput): Promise<void> {
  const commitHash = input.gitCommit ?? process.env.VERCEL_GIT_COMMIT_SHA ?? null;
  const ts = new Date().toISOString();
  const line = {
    type: "lecipm_deployment",
    timestamp: ts,
    ts,
    deploymentId: input.deploymentId ?? process.env.VERCEL_DEPLOYMENT_ID ?? null,
    commitHash,
    gitCommit: commitHash,
    triggeredBy: input.triggeredBy ?? process.env.VERCEL_GIT_COMMIT_AUTHOR ?? null,
    status: input.success ? ("success" as const) : ("failure" as const),
    success: input.success,
    version: input.version ?? process.env.npm_package_version ?? null,
    phase: input.phase,
    detail: input.detail,
    vercelEnv: process.env.VERCEL_ENV ?? null,
    ...input.meta,
  };
  logInfo("[deployment]", line);

  try {
    await recordPlatformEvent({
      eventType: input.success ? "deployment_success" : "deployment_failure",
      sourceModule: "deployment",
      entityType: "DEPLOYMENT",
      entityId: input.deploymentId ?? line.gitCommit ?? "unknown",
      payload: line as Record<string, unknown>,
    });
  } catch {
    /* non-blocking */
  }
}
