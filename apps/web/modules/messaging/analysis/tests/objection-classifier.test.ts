import { describe, expect, it } from "vitest";
import { classifyObjections } from "../objection-classifier";

describe("classifyObjections", () => {
  it("maps price language to price with evidence", () => {
    const r = classifyObjections([{ body: "This is too expensive for us right now.", counterpartyId: "c", senderId: "c" }]);
    expect(r.objections.some((o) => o.type === "price")).toBe(true);
    expect(r.dominantObjection).toBe("price");
  });

  it("maps timing hesitation", () => {
    const r = classifyObjections([{ body: "We are not ready yet to move forward." }]);
    expect(r.objections.some((o) => o.type === "timing")).toBe(true);
  });

  it("returns empty for sparse / no text without throwing", () => {
    const r = classifyObjections([{ body: "   " }]);
    expect(r.objections).toEqual([]);
    expect(r.dominantObjection).toBeNull();
  });
});
