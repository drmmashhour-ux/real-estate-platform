import { describe, expect, it } from "vitest";
import { z } from "zod";
import { emailSchema, isoDateSchema, parseJsonBody, uuidStringSchema } from "@/lib/security/validators";

describe("security validators", () => {
  it("accepts valid uuid", () => {
    expect(uuidStringSchema.safeParse("550e8400-e29b-41d4-a716-446655440000").success).toBe(true);
  });
  it("rejects invalid uuid", () => {
    expect(uuidStringSchema.safeParse("not-a-uuid").success).toBe(false);
  });
  it("normalizes email", () => {
    expect(emailSchema.parse(" Test@EXAMPLE.com ")).toBe("test@example.com");
  });
  it("validates iso date", () => {
    expect(isoDateSchema.safeParse("2026-04-02").success).toBe(true);
    expect(isoDateSchema.safeParse("2026-4-2").success).toBe(false);
  });
  it("parseJsonBody returns union", () => {
    const schema = z.object({ a: z.number() });
    const bad = parseJsonBody(schema, { a: "x" });
    expect(bad.ok).toBe(false);
    const good = parseJsonBody(schema, { a: 1 });
    expect(good.ok && good.data.a).toBe(1);
  });
});
