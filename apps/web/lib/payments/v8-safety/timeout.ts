/**
 * Timeout wrapper — aborts wait after `ms`; does not cancel underlying Stripe SDK work.
 */
export async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let t: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        t = setTimeout(() => reject(new Error(`v8_safety_timeout:${label}:${ms}ms`)), ms);
      }),
    ]);
  } finally {
    if (t) clearTimeout(t);
  }
}
