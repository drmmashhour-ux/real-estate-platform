import type { Partner } from "@/modules/platform/partner.types";
import type { WebhookEventName } from "./events";

/**
 * Deliver a signed-style payload to the partner webhook URL (best-effort).
 * Production should add HMAC signatures, retries, and DLQ.
 */
export async function dispatchPartnerWebhook(
  partner: Partner,
  event: WebhookEventName,
  payload: unknown
): Promise<void> {
  const url = partner.webhookUrl?.trim();
  if (!url) return;

  const body = JSON.stringify({
    event,
    deliveredAt: new Date().toISOString(),
    partnerId: partner.id,
    payload,
  });

  try {
    await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Platform-Event": event,
        "X-Platform-Partner": partner.id,
      },
      body,
    });
  } catch {
    // Swallow — webhook delivery is best-effort in this reference layer
  }
}
