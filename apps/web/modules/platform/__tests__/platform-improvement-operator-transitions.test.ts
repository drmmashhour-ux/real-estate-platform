import { describe, expect, it } from "vitest";
import {
  allowedNextStatuses,
  isTransitionAllowed,
  nextStatusForQuickAction,
} from "../platform-improvement-operator-transitions";

describe("platform-improvement-operator-transitions", () => {
  it("enforces linear progression without skips", () => {
    expect(isTransitionAllowed("new", "acknowledged")).toBe(true);
    expect(isTransitionAllowed("new", "planned")).toBe(false);
    expect(isTransitionAllowed("acknowledged", "planned")).toBe(true);
    expect(isTransitionAllowed("planned", "in_progress")).toBe(true);
    expect(isTransitionAllowed("in_progress", "done")).toBe(true);
  });

  it("terminal states reopen only to acknowledged", () => {
    expect(allowedNextStatuses("done")).toEqual(["acknowledged"]);
    expect(allowedNextStatuses("dismissed")).toEqual(["acknowledged"]);
  });

  it("maps quick actions to next statuses", () => {
    expect(nextStatusForQuickAction("new", "acknowledge")).toBe("acknowledged");
    expect(nextStatusForQuickAction("acknowledged", "plan")).toBe("planned");
    expect(nextStatusForQuickAction("planned", "start")).toBe("in_progress");
    expect(nextStatusForQuickAction("in_progress", "done")).toBe("done");
    expect(nextStatusForQuickAction("in_progress", "dismiss")).toBe("dismissed");
    expect(nextStatusForQuickAction("done", "reopen")).toBe("acknowledged");
  });
});
