import { describe, expect, it } from "vitest";
import {
  DARLINK_FORBIDDEN_IMPORTS,
  DARLINK_THEME_NAMESPACE,
  assertDarlinkIsolation,
} from "../darlink-guardrails";

describe("darlink guardrails", () => {
  it("locks namespace and forbidden import hints", () => {
    expect(DARLINK_THEME_NAMESPACE).toBe("darlink");
    expect(DARLINK_FORBIDDEN_IMPORTS).toContain("lecipm");
    const iso = assertDarlinkIsolation();
    expect(iso.namespace).toBe("darlink");
    expect(iso.forbidden).toBe(DARLINK_FORBIDDEN_IMPORTS);
    expect(iso.note.length).toBeGreaterThan(0);
  });
});
