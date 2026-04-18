import { describe, expect, it } from "vitest";
import { attentionLabel, mapUnifiedStatusToRoleAttention } from "./control-center-v3-status-mapper";

describe("control-center-v3-status-mapper", () => {
  it("maps healthy to ok", () => {
    expect(mapUnifiedStatusToRoleAttention("healthy")).toBe("ok");
    expect(attentionLabel("ok")).toBe("Stable");
  });

  it("maps warning to escalate", () => {
    expect(mapUnifiedStatusToRoleAttention("warning")).toBe("escalate");
  });
});
