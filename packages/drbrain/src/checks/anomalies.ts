import type { DrBrainAppId, DrBrainCheckResult } from "../types";

export async function runAnomalyChecks(input: {
  appId: DrBrainAppId;
  anomalyChecks?: () => Promise<DrBrainCheckResult[]>;
}): Promise<DrBrainCheckResult[]> {
  const { appId, anomalyChecks } = input;

  if (!anomalyChecks) {
    return [
      {
        appId,
        check: "anomalies.hooks",
        level: "INFO",
        ok: true,
        message: "No anomaly hooks registered for this run.",
      },
    ];
  }

  try {
    const rows = await anomalyChecks();
    return rows.length > 0
      ? rows
      : [
          {
            appId,
            check: "anomalies.hooks",
            level: "OK",
            ok: true,
            message: "Anomaly hooks returned no extra findings.",
          },
        ];
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return [
      {
        appId,
        check: "anomalies.hooks",
        level: "WARNING",
        ok: false,
        message: `Anomaly hook failed: ${msg}`,
      },
    ];
  }
}
