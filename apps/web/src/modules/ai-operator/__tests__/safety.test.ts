import { describe, it, expect } from "vitest";
import {
  requiresExplicitApproval,
  allowedInAutoRestrictedMode,
  isDestructiveOrOutbound,
  assertSafeToExecute,
} from "@/src/modules/ai-operator/policies/safety";

describe("safety policies", () => {
  it("blocks outbound types without explicit approval flag", () => {
    expect(() => assertSafeToExecute("send_message", false)).toThrow(/approval/i);
    expect(() => assertSafeToExecute("send_message", true)).not.toThrow();
  });

  it("run_simulation is allowed in auto restricted list", () => {
    expect(allowedInAutoRestrictedMode("run_simulation")).toBe(true);
    expect(allowedInAutoRestrictedMode("send_message")).toBe(false);
  });

  it("send_message requires explicit approval for automation gating", () => {
    expect(requiresExplicitApproval("send_message")).toBe(true);
    expect(requiresExplicitApproval("run_simulation")).toBe(false);
  });

  it("flags outbound channel types", () => {
    expect(isDestructiveOrOutbound("send_message")).toBe(true);
    expect(isDestructiveOrOutbound("publish_content")).toBe(true);
    expect(isDestructiveOrOutbound("run_simulation")).toBe(false);
  });
});
