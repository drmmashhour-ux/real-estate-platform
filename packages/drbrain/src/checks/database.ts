import type { DrBrainAppId, DrBrainCheckResult } from "../types";

export async function runDatabaseChecks(input: {
  appId: DrBrainAppId;
  dbPing?: () => Promise<boolean>;
}): Promise<DrBrainCheckResult[]> {
  const { appId, dbPing } = input;

  if (!dbPing) {
    return [
      {
        appId,
        check: "database.connectivity",
        level: "WARNING",
        ok: false,
        message: "Database checker not configured for this app.",
      },
    ];
  }

  try {
    const ok = await dbPing();
    return [
      {
        appId,
        check: "database.connectivity",
        level: ok ? "OK" : "CRITICAL",
        ok,
        message: ok ? "Database ping succeeded." : "Database ping returned failure.",
      },
    ];
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return [
      {
        appId,
        check: "database.connectivity",
        level: "CRITICAL",
        ok: false,
        message: `Database ping threw: ${msg}`,
      },
    ];
  }
}
