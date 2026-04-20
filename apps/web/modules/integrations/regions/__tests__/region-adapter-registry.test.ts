import { describe, expect, it } from "vitest";
import { getRegionBundle, listRegisteredRegionCodes } from "../region-adapter-registry";

describe("region-adapter-registry", () => {
  it("lists regions deterministically", () => {
    expect(listRegisteredRegionCodes()).toEqual(["ca_qc", "sy"]);
  });

  it("resolves Syria aliases", () => {
    expect(getRegionBundle("sy")?.adapter?.regionCode).toBe("sy");
    expect(getRegionBundle("SYRIA")?.adapter?.regionCode).toBe("sy");
  });

  it("resolves Québec / web aliases", () => {
    expect(getRegionBundle("qc")?.adapter?.regionCode).toBe("ca_qc");
    expect(getRegionBundle("ca_qc")?.adapter?.regionCode).toBe("ca_qc");
  });

  it("returns null for unknown regions", () => {
    expect(getRegionBundle("zz-unknown")).toBeNull();
  });
});
