import { describe, expect, it } from "vitest";
import { generateDeclarationPdf } from "@/src/modules/legal-workflow/infrastructure/generateDeclarationPdf";

describe("pdf generation", () => {
  it("returns deterministic PDF payload envelope", () => {
    const out = generateDeclarationPdf({ documentId: "doc1", payload: { a: 1 }, validationSummary: { isValid: true } });
    expect(out.fileName).toContain("doc1");
    expect(out.mimeType).toBe("application/pdf");
    expect(out.contentBase64.length).toBeGreaterThan(10);
  });
});
