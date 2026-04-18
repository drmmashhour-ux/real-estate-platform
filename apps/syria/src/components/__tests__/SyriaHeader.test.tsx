import { describe, expect, it } from "vitest";
import ar from "../../../messages/ar.json";

describe("SyriaHeader copy (Darlink)", () => {
  it("Arabic nav uses Darlink naming", () => {
    expect(ar.nav.brand).toContain("دار");
    expect(ar.nav.home).toBeTruthy();
  });
});
