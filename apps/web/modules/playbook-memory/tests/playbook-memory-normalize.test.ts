import { describe, expect, it } from "vitest";
import { normalizeContext, normalizeContextSnapshot } from "../utils/playbook-memory-normalize";

describe("playbook-memory-normalize", () => {
  it("drops undefined and sorts keys", () => {
    const n = normalizeContextSnapshot({
      z: 1,
      a: { m: 2, b: 1 },
      drop: undefined,
    });
    expect(n).toEqual({ a: { b: 1, m: 2 }, z: 1 });
    expect("drop" in n).toBe(false);
  });

  it("normalizeContext is stable for key order and nested objects", () => {
    const a = normalizeContext({ z: 1, n: { b: 2, a: 1 } });
    const b = normalizeContext({ n: { a: 1, b: 2 }, z: 1 });
    expect(a).toEqual(b);
  });
});
