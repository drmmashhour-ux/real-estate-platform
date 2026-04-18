import { describe, expect, it } from "vitest";
import { getRegionBundle, listRegisteredRegionCodes } from "../region-adapter-registry";

describe("region-adapter-registry", () => {
  it("lists regions deterministically", () => {
    expect(listRegisteredRegionCodes()).toEqual(["sy"]);
  });

  it("resolves Syria aliases", () => {
    expect(getRegionBundle("sy")?.adapter?.regionCode).toBe("sy");
    expect(getRegionBundle("SYRIA")?.adapter?.regionCode).toBe("sy");
  });

  it("returns null for unknown regions", () => {
    expect(getRegionBundle("qc")).toBeNull();
  });
});
