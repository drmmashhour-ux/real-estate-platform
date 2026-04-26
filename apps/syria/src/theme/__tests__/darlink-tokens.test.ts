import { describe, expect, it } from "vitest";
import { DARLINK_THEME_ID, DARLINK_THEME_NAMESPACE, darlinkColor } from "../darlink-tokens";

describe("darlink tokens", () => {
  it("locks palette and theme id", () => {
    expect(darlinkColor.navy.toLowerCase()).toBe("#0f172a");
    expect(darlinkColor.accent.toLowerCase()).toBe("#1f7a5c");
    expect(DARLINK_THEME_ID).toBe("darlink");
    expect(DARLINK_THEME_NAMESPACE).toBe("darlink");
  });
});
