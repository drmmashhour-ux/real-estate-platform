import { describe, expect, it } from "vitest";
import { classifyInboundSafety, SAFETY_REPLY } from "../safety";

describe("classifyInboundSafety", () => {
  it("returns null for empty", () => {
    expect(classifyInboundSafety("")).toBeNull();
  });

  it("detects viewing", () => {
    expect(classifyInboundSafety("Can we schedule a visit tomorrow?")).toBe("viewing_request");
  });

  it("detects offer intent", () => {
    expect(classifyInboundSafety("I want to submit an offer today")).toBe("offer_negotiation");
  });

  it("detects discriminatory", () => {
    expect(classifyInboundSafety("Is this whites only?")).toBe("discriminatory");
  });
});

describe("SAFETY_REPLY", () => {
  it("mentions broker", () => {
    expect(SAFETY_REPLY.toLowerCase()).toContain("broker");
  });
});
