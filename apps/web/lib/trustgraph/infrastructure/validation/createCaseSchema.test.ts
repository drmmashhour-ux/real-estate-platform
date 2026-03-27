import { describe, expect, it } from "vitest";
import { createCaseBodySchema } from "@/lib/trustgraph/infrastructure/validation/createCaseSchema";

describe("createCaseBodySchema", () => {
  it("accepts valid payload", () => {
    const r = createCaseBodySchema.safeParse({
      entityType: "LISTING",
      entityId: "abc123",
      triggerSource: "admin",
      assignedTo: null,
    });
    expect(r.success).toBe(true);
  });

  it("rejects empty entityId", () => {
    const r = createCaseBodySchema.safeParse({
      entityType: "LISTING",
      entityId: "",
    });
    expect(r.success).toBe(false);
  });
});
