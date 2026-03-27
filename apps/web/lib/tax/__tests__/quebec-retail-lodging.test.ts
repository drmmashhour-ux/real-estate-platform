import { describe, expect, it } from "vitest";
import {
  QUEBEC_GST_RATE,
  QUEBEC_QST_RATE,
  calculateQuebecRetailTaxOnLodgingBaseExclusiveCents,
} from "../quebec-tax-engine";

describe("Quebec retail lodging tax (GST then compound QST)", () => {
  it("applies GST on base then QST on base+GST", () => {
    const baseCents = 100_000; // $1000 taxable lodging + cleaning
    const r = calculateQuebecRetailTaxOnLodgingBaseExclusiveCents(baseCents);
    const expectedGst = Math.round(baseCents * QUEBEC_GST_RATE);
    expect(r.gstCents).toBe(expectedGst);
    const qstBase = baseCents + expectedGst;
    const expectedQst = Math.round(qstBase * QUEBEC_QST_RATE);
    expect(r.qstCents).toBe(expectedQst);
    expect(r.taxCents).toBe(expectedGst + expectedQst);
  });

  it("matches known $350 lodging base (from booking fee tests)", () => {
    const r = calculateQuebecRetailTaxOnLodgingBaseExclusiveCents(35_000);
    expect(r.gstCents).toBe(1750);
    expect(r.qstCents).toBe(Math.round(36_750 * QUEBEC_QST_RATE));
    expect(r.taxCents).toBe(r.gstCents + r.qstCents);
  });
});
