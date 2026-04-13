import { createSystemAlert } from "@/lib/observability";

/**
 * Optional hooks for cross-dashboard alerts (placeholders for email/Slack).
 */
export async function alertFraudSpike(params: {
  kind: string;
  message: string;
  metadata?: object;
}): Promise<void> {
  await createSystemAlert({
    alertType: `FRAUD_${params.kind}`,
    severity: "WARNING",
    message: params.message,
    metadata: params.metadata,
  });
}
