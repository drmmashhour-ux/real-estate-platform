import type { DrBrainAppId } from "./types";

function prefixFor(appId: DrBrainAppId): string {
  if (appId === "lecipm") return "[DR.BRAIN][LECIPM]";
  if (appId === "syria") return "[DR.BRAIN][SYRIA]";
  return "[DR.BRAIN][HADIALINK]";
}

export type DrBrainAlertSeverity = "info" | "warning" | "critical";

/**
 * Sends operator-visible alerts when configured; otherwise logs safely with console.warn only.
 * Never includes secrets — sanitize metadata keys containing secret/password/token patterns upstream.
 */
export async function sendDrBrainAlert(input: {
  appId: DrBrainAppId;
  severity: DrBrainAlertSeverity;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const prefix = prefixFor(input.appId);
  const body = `${prefix} ${input.severity.toUpperCase()} ${input.title}: ${input.message}`;
  const meta =
    input.metadata && Object.keys(input.metadata).length > 0
      ? JSON.stringify(stripRiskyKeys(input.metadata))
      : "";

  const alertsEnabled = process.env.DRBRAIN_ALERTS_ENABLED === "true";
  const webhook = process.env.DRBRAIN_SLACK_WEBHOOK_URL?.trim();
  const emailTo = process.env.DRBRAIN_EMAIL_TO?.trim();
  const provider = (process.env.DRBRAIN_EMAIL_PROVIDER ?? "console").toLowerCase();

  console.warn(body + (meta ? ` ${meta}` : ""));

  if (!alertsEnabled) {
    return;
  }

  if (webhook && webhook.startsWith("https://")) {
    try {
      await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: `${body}${meta ? `\n${meta}` : ""}`,
        }),
      });
    } catch {
      /* non-fatal */
    }
  }

  if (emailTo && provider !== "console") {
    console.warn(`${prefix} Email provider '${provider}' configured — DR.BRAIN email dispatch not wired in this phase.`);
  }
}

function stripRiskyKeys(meta: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const bad = /secret|password|token|authorization|apikey|private_key|database_url/i;
  for (const [k, v] of Object.entries(meta)) {
    if (bad.test(k)) continue;
    out[k] = v;
  }
  return out;
}
