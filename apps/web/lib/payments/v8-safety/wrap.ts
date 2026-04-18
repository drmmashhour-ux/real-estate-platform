/**
 * Orchestrates V8 safety wrappers around payment-adjacent async work.
 * When disabled, runs `fn()` unchanged — no behavior change for production.
 */
import { paymentsV8SafetyFlags } from "@/config/feature-flags";
import { auditV8PaymentSafety } from "./audit";
import { detectSlowOperation, recordOperationDuration } from "./anomaly";
import { peekDuplicateIdempotencyKey } from "./idempotency-boundary";
import { resolveV8SafetyTimeouts, type V8PaymentSafetyOperationOptions } from "./config";
import { withTransientRetry } from "./retry";
import { withTimeout } from "./timeout";

export async function runV8SafePaymentOperation<T>(
  opName: string,
  fn: () => Promise<T>,
  opts?: V8PaymentSafetyOperationOptions,
): Promise<T> {
  if (!paymentsV8SafetyFlags.paymentsV8SafetyV1) {
    return fn();
  }

  const { timeoutMs, maxRetries } = resolveV8SafetyTimeouts(opts);
  if (opts?.idempotencyKey && peekDuplicateIdempotencyKey(opts.idempotencyKey)) {
    auditV8PaymentSafety("duplicate_hint", opName, { idempotencyKey: opts.idempotencyKey });
  }

  auditV8PaymentSafety("start", opName, { timeoutMs, maxRetries });
  const t0 = Date.now();
  try {
    const result = await withTransientRetry(
      opName,
      maxRetries,
      async () => withTimeout(fn(), timeoutMs, opName),
    );
    const ms = Date.now() - t0;
    recordOperationDuration(opName, ms);
    detectSlowOperation(opName, ms);
    auditV8PaymentSafety("success", opName, { ms });
    return result;
  } catch (e) {
    const ms = Date.now() - t0;
    auditV8PaymentSafety("failure", opName, {
      ms,
      message: e instanceof Error ? e.message : String(e),
    });
    throw e;
  }
}
