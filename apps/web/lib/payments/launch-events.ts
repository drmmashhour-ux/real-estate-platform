import { persistLaunchEvent } from "@/src/modules/launch/persistLaunchEvent";

/** Normalized orchestration events stored in `launch_events`. */
export async function emitPaymentSuccess(payload: Record<string, unknown>): Promise<void> {
  await persistLaunchEvent("PAYMENT_SUCCESS", payload);
}

export async function emitPaymentFailed(payload: Record<string, unknown>): Promise<void> {
  await persistLaunchEvent("PAYMENT_FAILED", payload);
}

export async function emitPayoutSent(payload: Record<string, unknown>): Promise<void> {
  await persistLaunchEvent("PAYOUT_SENT", payload);
}
