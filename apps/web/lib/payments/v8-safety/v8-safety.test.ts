import { describe, expect, it, vi } from "vitest";
import { assertCheckoutSessionIdShape } from "./validation";
import { withTimeout } from "./timeout";
import { peekDuplicateIdempotencyKey } from "./idempotency-boundary";

describe("v8-safety validation", () => {
  it("accepts cs_ session ids", () => {
    expect(() => assertCheckoutSessionIdShape("cs_test_1234567890")).not.toThrow();
  });

  it("rejects non-cs_ ids", () => {
    expect(() => assertCheckoutSessionIdShape("sub_123")).toThrow();
  });
});

describe("v8-safety timeout", () => {
  it("rejects slow promise", async () => {
    await expect(
      withTimeout(
        new Promise((r) => setTimeout(() => r(1), 50)),
        5,
        "test",
      ),
    ).rejects.toThrow(/v8_safety_timeout/);
  });
});

describe("idempotency boundary", () => {
  it("detects duplicate key within window", () => {
    expect(peekDuplicateIdempotencyKey("k-a")).toBe(false);
    expect(peekDuplicateIdempotencyKey("k-a")).toBe(true);
  });
});
