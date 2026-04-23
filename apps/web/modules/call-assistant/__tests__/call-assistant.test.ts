import { describe, expect, it } from "vitest";

import {
  advanceStageAfterLine,
  getNextLine,
  nextDiscoveryIndex,
} from "../call-assistant.service";
import { detectObjectionFromProspectText, getObjectionReplies } from "../call-objection.service";

const coldBroker = "cold_call_broker" as const;

describe("call-objection.service", () => {
  it("detects keyword phrases", () => {
    expect(detectObjectionFromProspectText("Sorry, not interested today")?.id).toBe("not_interested");
    expect(detectObjectionFromProspectText("I'm swamped")?.id).toBe("busy");
    expect(detectObjectionFromProspectText("We already have enough leads")?.id).toBe("already_have_leads");
    expect(detectObjectionFromProspectText("Just send me an email")?.id).toBe("send_email");
    expect(detectObjectionFromProspectText("We're already working with someone")?.id).toBe("working_with_someone");
  });

  it("returns 2–3 replies for cold_call_broker not_interested", async () => {
    const { getScriptByCategory } = await import("@/modules/sales-scripts/sales-script.service");
    const script = getScriptByCategory(coldBroker, {
      audience: "BROKER",
    });
    const replies = getObjectionReplies(script, "not_interested");
    expect(replies.length).toBeGreaterThanOrEqual(2);
    expect(replies.length).toBeLessThanOrEqual(3);
  });
});

describe("call-assistant.service getNextLine", () => {
  const base = {
    audience: "BROKER" as const,
    scriptCategory: coldBroker,
    scriptContext: { audience: "BROKER" as const },
  };

  it("opening → suggested opening line", () => {
    const r = getNextLine({ ...base, stage: "opening" });
    expect(r.stage).toBe("opening");
    expect(r.suggested.toLowerCase()).toContain("quick");
    expect(r.alternatives.length).toBeGreaterThan(0);
  });

  it("pitch → hook-focused suggestion", () => {
    const r = getNextLine({ ...base, stage: "pitch" });
    expect(r.stage).toBe("pitch");
    expect(r.suggested.length).toBeGreaterThan(10);
  });

  it("discovery respects index", () => {
    const r0 = getNextLine({ ...base, stage: "discovery", discoveryIndex: 0 });
    const r1 = getNextLine({ ...base, stage: "discovery", discoveryIndex: 1 });
    expect(r0.suggested).not.toBe(r1.suggested);
  });

  it("forces objection stage when prospect text matches", () => {
    const r = getNextLine({
      ...base,
      stage: "pitch",
      lastProspectInput: "I'm not interested",
    });
    expect(r.stage).toBe("objection");
    expect(r.objectionLabel).toBeDefined();
  });

  it("manual objection stage returns script objection lines", () => {
    const r = getNextLine({ ...base, stage: "objection", lastProspectInput: undefined });
    expect(r.stage).toBe("objection");
    expect(r.suggested.length).toBeGreaterThan(5);
  });
});

describe("flow transitions", () => {
  const ctx = {
    audience: "BROKER" as const,
    scriptCategory: coldBroker as const,
    scriptContext: { audience: "BROKER" as const },
    discoveryIndex: 0 as number | undefined,
  };

  it("advances opening → pitch → discovery → closing", () => {
    expect(advanceStageAfterLine("opening", ctx)).toBe("pitch");
    expect(advanceStageAfterLine("pitch", ctx)).toBe("discovery");
    expect(advanceStageAfterLine("discovery", ctx)).toBe("discovery"); // idx 0 → another discovery question
    expect(advanceStageAfterLine("discovery", { ...ctx, discoveryIndex: 1 })).toBe("closing"); // last question answered
  });

  it("bumps discovery index inside discovery", () => {
    expect(nextDiscoveryIndex(ctx)).toBe(1);
    expect(nextDiscoveryIndex({ ...ctx, discoveryIndex: 99 })).toBeGreaterThanOrEqual(0);
  });
});
