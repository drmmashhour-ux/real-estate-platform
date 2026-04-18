/**
 * V8 payment safety layer — configuration only (no financial truth).
 */
export type V8PaymentSafetyOperationOptions = {
  /** Wall-clock timeout for the wrapped promise. */
  timeoutMs?: number;
  /** Retries for transient Stripe/network failures (safe read paths only). */
  maxRetries?: number;
  /** Client-supplied idempotency hint (logging / duplicate detection only). */
  idempotencyKey?: string;
};

const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_RETRIES = 1;

export function resolveV8SafetyTimeouts(opts?: V8PaymentSafetyOperationOptions): {
  timeoutMs: number;
  maxRetries: number;
} {
  return {
    timeoutMs: opts?.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    maxRetries: opts?.maxRetries ?? DEFAULT_RETRIES,
  };
}

export { DEFAULT_TIMEOUT_MS, DEFAULT_RETRIES };
