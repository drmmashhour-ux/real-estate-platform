import { describe, expect, it } from "vitest";
import { assertSafeMetadata } from "@/lib/payments/security";

describe("assertSafeMetadata", () => {
  it("drops suspicious keys", () => {
    const out = assertSafeMetadata({ userId: "u1", pan: "4111", cvv: "123" });
    expect(out.userId).toBe("u1");
    expect(out.pan).toBeUndefined();
    expect(out.cvv).toBeUndefined();
  });
});
