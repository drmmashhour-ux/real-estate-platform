import { describe, expect, it } from "vitest";
import { computeDiff } from "@/modules/ai-memory/diffEngine";
import { anonymizeJsonValue } from "@/modules/ai-memory/anonymize-json";
import { makePatternKey, inferFindingKey, PATTERN_THRESHOLD } from "@/modules/ai-memory/pattern-extraction";

describe("AiMemoryEngine", () => {
  it("computeDiff finds rewritten clause when wording changes but similar", () => {
    const original = "1. La garantie légale est exclue sans précision.\n\n2. Le prix est cent dollars.";
    const final = "1. La garantie légale est exclue uniquement quant aux vices cachés pour le vendeur immédiat.\n\n2. Le prix est cent dollars.";
    const d = computeDiff(original, final);
    expect(d.rewritten.length).toBeGreaterThanOrEqual(1);
    expect(d.added.length + d.removed.length).toBeGreaterThanOrEqual(0);
  });

  it("anonymizeJsonValue redacts email-like strings", () => {
    const out = anonymizeJsonValue({ contact: "reach me at buyer@example.com please" });
    expect(JSON.stringify(out)).not.toContain("buyer@");
    expect(JSON.stringify(out)).toContain("REDACTED");
  });

  it("makePatternKey is stable for same inputs", () => {
    const a = makePatternKey("K", "hello world", "hello monde");
    const b = makePatternKey("K", "hello world", "hello monde");
    expect(a).toBe(b);
  });

  it("inferFindingKey maps warranty-like rewrites", () => {
    expect(inferFindingKey("garantie exclue", "exclusion partielle")).toBe("WARRANTY_EXCLUSION_UNCLEAR");
  });

  it("PATTERN_THRESHOLD is 3", () => {
    expect(PATTERN_THRESHOLD).toBe(3);
  });
});
