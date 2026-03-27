import { describe, expect, it } from "vitest";
import { redactSensitiveText } from "./redact";

describe("redactSensitiveText", () => {
  it("redacts bearer tokens and stripe-style secrets", () => {
    expect(redactSensitiveText('Authorization: Bearer abc.def.ghi')).toContain("[REDACTED]");
    expect(redactSensitiveText("sk_test_1234567890")).toBe("[REDACTED]");
    expect(redactSensitiveText("prefix whsec_abcd1234 suffix")).toContain("[REDACTED]");
  });

  it("leaves benign text intact", () => {
    expect(redactSensitiveText("hello world")).toBe("hello world");
  });
});
