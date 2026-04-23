import { describe, expect, it } from "vitest";

import { defaultStepFromCallStage, stepIndex } from "../closing-steps.engine";
import { getNextStep, shouldAutoClose } from "../closing-flow.service";
import { buildUltimateCloserPayload, closerStepRail } from "../closing-response.service";
import { getHardObjectionResponse } from "../objection-close.service";

describe("closing-steps.engine", () => {
  it("maps call stages to default closer steps", () => {
    expect(defaultStepFromCallStage("opening")).toBe("hook");
    expect(defaultStepFromCallStage("pitch")).toBe("value");
    expect(defaultStepFromCallStage("discovery")).toBe("question");
    expect(defaultStepFromCallStage("objection")).toBe("align");
    expect(defaultStepFromCallStage("closing")).toBe("final_close");
  });

  it("orders steps for rail UI", () => {
    expect(stepIndex("hook")).toBe(0);
    expect(stepIndex("final_close")).toBe(5);
    const rail = closerStepRail("question");
    expect(rail.filter((x) => x.done).length).toBe(2);
  });
});

describe("closing-flow.service", () => {
  it("routes objections to align", () => {
    const m = getNextStep({
      callStage: "pitch",
      audience: "BROKER",
      lastProspectInput: "Just send me an email",
    });
    expect(m.step).toBe("align");
  });

  it("detects close-now readiness", () => {
    expect(
      shouldAutoClose({
        callStage: "discovery",
        audience: "BROKER",
        lastProspectInput: "Send the calendar invite — tomorrow morning works.",
      }).close,
    ).toBe(true);
  });
});

describe("closing-response.service", () => {
  it("returns merged payload with lines and avoid list", () => {
    const p = buildUltimateCloserPayload({
      callStage: "pitch",
      audience: "BROKER",
      lastProspectInput: "Walk me through your methodology and cohort definition.",
    });
    expect(p.mainLine.length).toBeGreaterThan(20);
    expect(p.alternatives[0].length).toBeGreaterThan(10);
    expect(p.avoid.length).toBeGreaterThan(2);
    expect(p.personalityLabel).toMatch(/🔷|⚡|✨|🤝/);
  });

  it("forces final close when auto-close triggers", () => {
    const p = buildUltimateCloserPayload({
      callStage: "opening",
      audience: "BROKER",
      lastProspectInput: "Yes — book me for tomorrow morning.",
    });
    expect(p.closeNow).toBe(true);
    expect(p.step).toBe("final_close");
  });
});

describe("objection-close.service", () => {
  it("returns hard objection scripts", () => {
    const o = getHardObjectionResponse("no_time");
    expect(o.main).toContain("minutes");
    expect(o.avoid.length).toBeGreaterThan(0);
  });
});
