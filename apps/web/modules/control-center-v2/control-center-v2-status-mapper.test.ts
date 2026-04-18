import { describe, expect, it } from "vitest";
import { mapHealthToRolloutPosture, postureLabel } from "./control-center-v2-status-mapper";

describe("control-center-v2-status-mapper", () => {
  it("prefers blocked hint", () => {
    expect(
      mapHealthToRolloutPosture("healthy", {
        blockedHint: true,
        primaryFlag: true,
      }),
    ).toBe("blocked");
  });

  it("maps primary when not blocked", () => {
    expect(
      mapHealthToRolloutPosture("healthy", {
        primaryFlag: true,
        influenceFlag: true,
        shadowFlag: true,
      }),
    ).toBe("primary");
  });

  it("postureLabel returns string", () => {
    expect(postureLabel("shadow")).toBe("Shadow");
  });
});
