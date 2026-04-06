import { describe, expect, it } from "vitest";
import {
  CONVERSION_OBJECTIONS,
  objectionFullSequence,
  objectionMessage1,
  objectionMessage2,
} from "../conversion-objections";

describe("conversion-objections", () => {
  it("builds two-message flow: acknowledge+question then push", () => {
    const o = CONVERSION_OBJECTIONS.find((x) => x.id === "browsing")!;
    expect(objectionMessage1(o)).toContain("Totally fair");
    expect(objectionMessage1(o)).toContain("stand out");
    expect(objectionMessage2(o)).toContain("one inquiry");
  });

  it("trust flow uses single block as message 1 when question empty", () => {
    const o = CONVERSION_OBJECTIONS.find((x) => x.id === "trust")!;
    expect(objectionMessage1(o)).toContain("verified listings");
    expect(objectionMessage2(o)).toContain("one inquiry");
  });

  it("full sequence includes both messages", () => {
    const o = CONVERSION_OBJECTIONS.find((x) => x.id === "think")!;
    const full = objectionFullSequence(o);
    expect(full).toContain("Message 1");
    expect(full).toContain("Message 2");
    expect(full).toContain("next step");
  });
});
