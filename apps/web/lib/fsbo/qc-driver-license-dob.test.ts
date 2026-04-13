import { describe, expect, it } from "vitest";
import { checkQuebecDriverLicenseDob } from "@/lib/fsbo/qc-driver-license-dob";

describe("checkQuebecDriverLicenseDob", () => {
  it("matches when middle segment is MMDDYY", () => {
    // Born 1974-12-17 → 12 / 17 / 74 + trailing 08
    const id = "L153112177408";
    const r = checkQuebecDriverLicenseDob("DRIVERS_LICENSE", id, "1974-12-17");
    expect(r.show && r.variant === "match").toBe(true);
  });

  it("matches when middle segment is DDMMYY (Québec-style)", () => {
    // Same DOB; encoded as 17 12 74 + 08
    const id = "L153117127408";
    const r = checkQuebecDriverLicenseDob("DRIVERS_LICENSE", id, "1974-12-17");
    expect(r.show && r.variant === "match").toBe(true);
  });

  it("accepts hyphens and spaces", () => {
    const r = checkQuebecDriverLicenseDob("DRIVERS_LICENSE", "L1531-121774-08", "1974-12-17");
    expect(r.show && r.variant === "match").toBe(true);
  });

  it("mismatches when year does not align", () => {
    const r = checkQuebecDriverLicenseDob("DRIVERS_LICENSE", "L153112177408", "1974-12-18");
    expect(r.show && r.variant === "mismatch").toBe(true);
  });

  it("hidden for non-driver ID", () => {
    const r = checkQuebecDriverLicenseDob("PASSPORT", "L153112177408", "1974-12-17");
    expect(r.show).toBe(false);
  });
});
