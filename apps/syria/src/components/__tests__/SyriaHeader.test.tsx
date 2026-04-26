import { describe, expect, it } from "vitest";
import ar from "../../../messages/ar.json";

describe("SyriaHeader copy (Hadiah Link)", () => {
  it("Arabic nav uses Hadiah Link naming", () => {
    expect(ar.nav.brand).toContain("هدية");
    expect(ar.nav.home).toBeTruthy();
  });
});
