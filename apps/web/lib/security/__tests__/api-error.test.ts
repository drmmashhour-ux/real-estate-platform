import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { isProductionLike, safeApiError, toSafeErrorMessage } from "@/lib/security/api-error";

describe("api-error", () => {
  const origNodeEnv = process.env.NODE_ENV;
  const origVercel = process.env.VERCEL;

  afterEach(() => {
    process.env.NODE_ENV = origNodeEnv;
    process.env.VERCEL = origVercel;
    vi.restoreAllMocks();
  });

  describe("isProductionLike", () => {
    it("is true when NODE_ENV is production", () => {
      process.env.NODE_ENV = "production";
      process.env.VERCEL = "";
      expect(isProductionLike()).toBe(true);
    });

    it("is true when VERCEL is 1", () => {
      process.env.NODE_ENV = "development";
      process.env.VERCEL = "1";
      expect(isProductionLike()).toBe(true);
    });
  });

  describe("toSafeErrorMessage", () => {
    beforeEach(() => {
      process.env.NODE_ENV = "production";
      process.env.VERCEL = "";
    });

    it("hides Error message in production-like env", () => {
      expect(toSafeErrorMessage(new Error("internal/db/path"), "fallback")).toBe("fallback");
    });

    it("returns Error message in development", () => {
      process.env.NODE_ENV = "development";
      process.env.VERCEL = "";
      expect(toSafeErrorMessage(new Error("visible"), "fallback")).toBe("visible");
    });
  });

  describe("safeApiError", () => {
    beforeEach(() => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      process.env.NODE_ENV = "production";
      process.env.VERCEL = "";
    });

    it("returns JSON body without stack", async () => {
      const res = safeApiError(500, "Something went wrong", {
        code: "INTERNAL",
        requestId: "req-1",
        cause: new Error("secret stack"),
      });
      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body).toEqual({ error: "Something went wrong", code: "INTERNAL" });
      expect(JSON.stringify(body)).not.toContain("secret stack");
    });
  });
});
