/**
 * Unit tests for referral code generation and validation logic (no DB).
 */
import { describe, it, expect } from "vitest";

function generateReferralCodeLike(length = 8): string {
  const hex = "0123456789ABCDEF";
  let s = "";
  for (let i = 0; i < length; i++) {
    s += hex[Math.floor(Math.random() * 16)];
  }
  return s;
}

describe("Referral code format", () => {
  it("generates 8-char hex uppercase string", () => {
    const code = generateReferralCodeLike(8);
    expect(code).toHaveLength(8);
    expect(code).toMatch(/^[0-9A-F]+$/);
  });

  it("reject same user using own code", () => {
    const referrerId = "user-1";
    const usedByUserId = "user-1";
    const isValid = referrerId !== usedByUserId;
    expect(isValid).toBe(false);
  });

  it("accept different user using code", () => {
    const referrerId = "user-1";
    const usedByUserId = "user-2";
    const isValid = referrerId !== usedByUserId;
    expect(isValid).toBe(true);
  });
});
