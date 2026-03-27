import { describe, expect, it } from "vitest";
import { canTransition } from "@/src/modules/legal-workflow/domain/workflow.rules";

describe("workflow transitions", () => {
  it("allows deterministic legal transitions", () => {
    expect(canTransition("draft", "in_review")).toBe(true);
    expect(canTransition("approved", "finalized")).toBe(true);
    expect(canTransition("finalized", "exported")).toBe(true);
  });

  it("blocks invalid transitions", () => {
    expect(canTransition("draft", "approved")).toBe(false);
    expect(canTransition("signed", "draft")).toBe(false);
  });
});
