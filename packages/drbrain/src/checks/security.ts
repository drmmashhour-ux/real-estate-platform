import type { DrBrainAppId, DrBrainCheckResult } from "../types";

export function runSecurityChecks(input: { appId: DrBrainAppId }): DrBrainCheckResult[] {
  const { appId } = input;
  const nodeEnv = process.env.NODE_ENV ?? "development";
  const results: DrBrainCheckResult[] = [];

  results.push({
    appId,
    check: "security.node_env",
    level: "INFO",
    ok: true,
    message: `NODE_ENV=${nodeEnv}`,
  });

  return results;
}
