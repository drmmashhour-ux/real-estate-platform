import { describe, expect, it } from "vitest";
import { detectLegalIntent } from "@/src/modules/ai-legal-assistant/application/detectLegalIntent";

describe("detectLegalIntent", () => {
  it("routes intents deterministically", () => {
    expect(detectLegalIntent("Explain this clause")).toBe("explain_clause");
    expect(detectLegalIntent("What is missing?")).toBe("identify_missing_items");
    expect(detectLegalIntent("Compare versions")).toBe("compare_versions");
    expect(detectLegalIntent("Is this ready for signature?")).toBe("prepare_for_signature");
  });
});
