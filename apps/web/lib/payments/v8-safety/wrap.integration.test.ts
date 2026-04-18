import { describe, expect, it, vi } from "vitest";

vi.mock("@/config/feature-flags", async (importOriginal) => {
  const a = await importOriginal<typeof import("@/config/feature-flags")>();
  return {
    ...a,
    paymentsV8SafetyFlags: { paymentsV8SafetyV1: true },
  };
});

import { runV8SafePaymentOperation } from "./wrap";

describe("runV8SafePaymentOperation", () => {
  it("wraps successful fn with safety on", async () => {
    let n = 0;
    const r = await runV8SafePaymentOperation("test.op", async () => {
      n += 1;
      return 42;
    });
    expect(r).toBe(42);
    expect(n).toBe(1);
  });

  it("propagates errors", async () => {
    await expect(
      runV8SafePaymentOperation("test.fail", async () => {
        throw new Error("boom");
      }),
    ).rejects.toThrow("boom");
  });
});
