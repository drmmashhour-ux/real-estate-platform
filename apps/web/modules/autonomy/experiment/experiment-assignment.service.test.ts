import { describe, expect, it } from "vitest";

import { assignToGroup } from "./experiment-assignment.service";

describe("assignToGroup", () => {
  it("is deterministic for same inputs", () => {
    expect(assignToGroup("listing-abc", 0.5, "exp1")).toBe(assignToGroup("listing-abc", 0.5, "exp1"));
  });

  it("varies assignment across experiments via salt (salt is part of the hashed key)", () => {
    const saltA = "cmjw7holdout-alpha";
    const saltB = "cmjw8holdout-beta";
    let found = false;
    for (let i = 0; i < 800; i++) {
      const id = `listing-${i}`;
      if (assignToGroup(id, 0.5, saltA) !== assignToGroup(id, 0.5, saltB)) {
        found = true;
        break;
      }
    }
    expect(found).toBe(true);
  });

  it("respects traffic split boundaries", () => {
    expect(assignToGroup("x", 0, "s")).toBe("control");
    expect(assignToGroup("x", 1, "s")).toBe("treatment");
  });

  it("clamps traffic split to [0, 1]", () => {
    expect(assignToGroup("stable-id-for-test", -1, "")).toBe(assignToGroup("stable-id-for-test", 0, ""));
    expect(assignToGroup("stable-id-for-test", 2, "")).toBe(assignToGroup("stable-id-for-test", 1, ""));
  });
});
