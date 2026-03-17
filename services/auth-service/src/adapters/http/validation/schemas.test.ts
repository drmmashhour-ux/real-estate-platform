import { describe, it, expect } from "vitest";
import {
  registerBodySchema,
  loginBodySchema,
  logoutBodySchema,
  refreshBodySchema,
} from "./schemas.js";
import { Role } from "../../../domain/enums/Role.js";

describe("auth validation schemas", () => {
  describe("registerBodySchema", () => {
    it("accepts valid register payload", () => {
      const data = {
        email: "user@example.com",
        password: "SecurePass123",
        name: "User",
        role: Role.GUEST,
      };
      expect(registerBodySchema.safeParse(data).success).toBe(true);
    });

    it("normalizes email to lowercase", () => {
      const result = registerBodySchema.safeParse({
        email: "User@Example.COM",
        password: "password123",
      });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.email).toBe("user@example.com");
    });

    it("rejects invalid email", () => {
      expect(registerBodySchema.safeParse({ email: "notanemail", password: "password123" }).success).toBe(false);
    });

    it("rejects short password", () => {
      expect(registerBodySchema.safeParse({ email: "a@b.co", password: "short" }).success).toBe(false);
    });

    it("rejects invalid role", () => {
      expect(
        registerBodySchema.safeParse({
          email: "a@b.co",
          password: "password123",
          role: "SUPERUSER",
        }).success
      ).toBe(false);
    });
  });

  describe("loginBodySchema", () => {
    it("accepts valid login payload", () => {
      expect(loginBodySchema.safeParse({ email: "u@x.com", password: "p" }).success).toBe(true);
    });

    it("rejects empty password", () => {
      expect(loginBodySchema.safeParse({ email: "u@x.com", password: "" }).success).toBe(false);
    });
  });

  describe("logoutBodySchema", () => {
    it("accepts refreshToken", () => {
      expect(logoutBodySchema.safeParse({ refreshToken: "abc" }).success).toBe(true);
    });

    it("rejects empty refreshToken", () => {
      expect(logoutBodySchema.safeParse({ refreshToken: "" }).success).toBe(false);
    });
  });

  describe("refreshBodySchema", () => {
    it("accepts refreshToken", () => {
      expect(refreshBodySchema.safeParse({ refreshToken: "xyz" }).success).toBe(true);
    });
  });
});
