import { triggerAlert } from "@/modules/alerts/alert.service";

export async function reportPaymentAnomaly(input: {
  message: string;
  stripeEventId?: string | null;
  meta?: Record<string, unknown>;
}): Promise<void> {
  await triggerAlert({
    type: "payment_failure",
    severity: "critical",
    message: input.message,
    meta: { ...input.meta, stripeEventId: input.stripeEventId ?? undefined },
  });
}
