import { describe, expect, it } from "vitest";
import { evaluateDeclarationKnowledgeRules } from "@/src/modules/knowledge/rules/knowledgeRuleEngine";

describe("knowledge rule engine", () => {
  it("blocks missing declaration and identity", () => {
    const a = evaluateDeclarationKnowledgeRules({});
    expect(a.blocks.some((b) => b.includes("Missing seller declaration"))).toBe(true);
    const b = evaluateDeclarationKnowledgeRules({ property_type: "condo" });
    expect(b.blocks.some((x) => x.includes("identity"))).toBe(true);
  });

  it("warns on incomplete declaration", () => {
    const out = evaluateDeclarationKnowledgeRules({
      property_address: "1 Main",
      property_type: "condo",
      owner_occupied: true,
    });
    expect(out.warnings.some((w) => w.includes("Incomplete"))).toBe(true);
  });
});
