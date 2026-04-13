import { describe, expect, it } from "vitest";
import {
  isAllowedListingImageMime,
  LISTING_IMAGE_MAX_BYTES,
  sanitizeUploadBasename,
} from "@/lib/security/upload-policy";

describe("upload-policy", () => {
  describe("sanitizeUploadBasename", () => {
    it("strips path segments", () => {
      expect(sanitizeUploadBasename("../../etc/passwd", ".jpg")).toMatch(/^[^/\\]+$/);
      expect(sanitizeUploadBasename("..\\..\\evil", ".png")).not.toContain("..");
    });

    it("replaces dangerous script-like names", () => {
      const out = sanitizeUploadBasename("payload.svg", ".jpg");
      expect(out.toLowerCase()).not.toMatch(/\.svg$/);
      expect(out).toContain("sanitized");
    });

    it("handles empty names", () => {
      expect(sanitizeUploadBasename("..", ".webp")).toMatch(/^upload\.webp$/);
    });
  });

  describe("isAllowedListingImageMime", () => {
    it("allows listed image types", () => {
      expect(isAllowedListingImageMime("image/jpeg")).toBe(true);
      expect(isAllowedListingImageMime("image/png")).toBe(true);
      expect(isAllowedListingImageMime("IMAGE/WEBP")).toBe(true);
    });

    it("rejects html and octet-stream", () => {
      expect(isAllowedListingImageMime("text/html")).toBe(false);
      expect(isAllowedListingImageMime("application/octet-stream")).toBe(false);
    });
  });

  it("LISTING_IMAGE_MAX_BYTES is bounded", () => {
    expect(LISTING_IMAGE_MAX_BYTES).toBeLessThanOrEqual(20 * 1024 * 1024);
    expect(LISTING_IMAGE_MAX_BYTES).toBeGreaterThan(0);
  });
});
