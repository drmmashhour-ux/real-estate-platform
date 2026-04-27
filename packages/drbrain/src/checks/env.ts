import { assertEnvSafety } from "@repo/db/env-guard";
import type { AppId } from "@repo/db/env-guard";
import type { DrBrainAppId, DrBrainCheckResult } from "../types";

function mapAppId(id: DrBrainAppId): AppId {
  return id as AppId;
}

function redactedDbHint(raw: string | undefined): string {
  const s = raw?.trim() ?? "";
  try {
    const u = new URL(s.startsWith("postgres") ? s : `postgresql://_${s}`);
    const host = u.hostname || "(host)";
    const db = u.pathname || "/";
    return `postgres://***:***@${host}${db}`;
  } catch {
    return "(invalid or unset)";
  }
}

export async function runEnvIsolationChecks(input: {
  appId: DrBrainAppId;
  env: Record<string, string | undefined>;
}): Promise<DrBrainCheckResult[]> {
  const { appId, env } = input;
  const results: DrBrainCheckResult[] = [];

  results.push({
    appId,
    check: "env.app_id_present",
    level: env.APP_ID?.trim() ? "OK" : "INFO",
    ok: Boolean(env.APP_ID?.trim()),
    message: env.APP_ID?.trim()
      ? `APP_ID=${env.APP_ID.trim()}`
      : "APP_ID is not set — recommended for isolation audits.",
  });

  const appEnvRaw = env.APP_ENV ?? env.NODE_ENV;
  results.push({
    appId,
    check: "env.app_env_present",
    level: appEnvRaw?.trim() ? "OK" : "INFO",
    ok: Boolean(appEnvRaw?.trim()),
    message: appEnvRaw?.trim()
      ? `APP_ENV/NODE_ENV resolves (${String(appEnvRaw)})`
      : "APP_ENV is not set — NODE_ENV fallback only.",
    metadata: { hint: redactedDbHint(env.DATABASE_URL) },
  });

  const dbUrl = env.DATABASE_URL?.trim();
  results.push({
    appId,
    check: "env.database_url_present",
    level: dbUrl ? "OK" : "CRITICAL",
    ok: Boolean(dbUrl),
    message: dbUrl ? `DATABASE_URL present (${redactedDbHint(dbUrl)})` : "DATABASE_URL is missing.",
  });

  try {
    assertEnvSafety({
      appId: mapAppId(appId),
      appEnv: appEnvRaw,
      dbUrl,
      demoMode: env.INVESTOR_DEMO_MODE === "true",
    });
    results.push({
      appId,
      check: "env.assertEnvSafety",
      level: "OK",
      ok: true,
      message: "@repo/db env isolation checks passed.",
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    results.push({
      appId,
      check: "env.assertEnvSafety",
      level: "CRITICAL",
      ok: false,
      message: msg,
      metadata: { hint: redactedDbHint(dbUrl) },
    });
  }

  return results;
}
