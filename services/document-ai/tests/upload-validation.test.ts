import { describe, expect, it } from "vitest";
import { isPdfBuffer, isSupportedUploadFile } from "../src/services/upload-validation";

describe("upload validation", () => {
  it("accepts PDF uploads", () => {
    expect(
      isSupportedUploadFile({
        mimetype: "application/pdf",
        originalname: "land-register.pdf",
      }),
    ).toBe(true);
  });

  it("accepts AI uploads with recognized mime type", () => {
    expect(
      isSupportedUploadFile({
        mimetype: "application/postscript",
        originalname: "drawing.ai",
      }),
    ).toBe(true);
  });

  it("accepts AI uploads with generic mime type", () => {
    expect(
      isSupportedUploadFile({
        mimetype: "application/octet-stream",
        originalname: "file.ai",
      }),
    ).toBe(true);
  });

  it("rejects non-PDF and non-AI uploads", () => {
    expect(
      isSupportedUploadFile({
        mimetype: "image/png",
        originalname: "image.png",
      }),
    ).toBe(false);
  });
});

describe("pdf buffer detection", () => {
  it("detects PDF magic header", () => {
    expect(isPdfBuffer(Buffer.from("%PDF-1.7\nfoo", "ascii"))).toBe(true);
  });

  it("rejects postscript-only AI payloads", () => {
    expect(isPdfBuffer(Buffer.from("%!PS-Adobe-3.0", "ascii"))).toBe(false);
  });
});
