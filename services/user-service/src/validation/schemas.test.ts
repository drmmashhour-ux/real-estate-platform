import { describe, it, expect } from "vitest";
import { patchMeBodySchema, patchSettingsBodySchema } from "./schemas.js";

describe("user validation schemas", () => {
  describe("patchMeBodySchema", () => {
    it("accepts valid partial profile", () => {
      expect(patchMeBodySchema.safeParse({ name: "Alice" }).success).toBe(true);
      expect(patchMeBodySchema.safeParse({ locale: "en_CA", timezone: "America/Montreal" }).success).toBe(true);
    });

    it("accepts empty object", () => {
      expect(patchMeBodySchema.safeParse({}).success).toBe(true);
    });

    it("rejects invalid locale", () => {
      expect(patchMeBodySchema.safeParse({ locale: "invalid" }).success).toBe(false);
    });
  });

  describe("patchSettingsBodySchema", () => {
    it("accepts settings object", () => {
      expect(patchSettingsBodySchema.safeParse({ settings: {} }).success).toBe(true);
      expect(
        patchSettingsBodySchema.safeParse({
          settings: { notifications: { email: true } },
        }).success
      ).toBe(true);
    });

    it("rejects missing settings", () => {
      expect(patchSettingsBodySchema.safeParse({}).success).toBe(false);
    });
  });
});
