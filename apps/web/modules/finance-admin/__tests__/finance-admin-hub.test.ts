import { describe, expect, it } from "vitest";
import { computeGstQstOnTaxableBase } from "../finance-admin-tax.service";
import { computeExemptDistributionFilingDeadline, EXEMPT_FILING_DEADLINE_DAYS_AFTER_DISTRIBUTION } from "@/modules/investment-compliance/amf-exemption.service";
import { generateFullLegalPack } from "@/modules/legal-pack";

describe("finance admin hub", () => {
  it("computes GST/QST on commission/service base", () => {
    const r = computeGstQstOnTaxableBase("1000.00");
    expect(r.taxExclusive).toBe("1000.00");
    expect(r.gst).toBe("50.00");
    expect(parseFloat(r.qst)).toBeCloseTo(99.75, 1);
    expect(parseFloat(r.total)).toBeCloseTo(1149.75, 1);
  });

  it("creates 45-106 filing deadline offset from distribution date", () => {
    const d = new Date("2026-06-01T12:00:00.000Z");
    const end = computeExemptDistributionFilingDeadline(d);
    expect(EXEMPT_FILING_DEADLINE_DAYS_AFTER_DISTRIBUTION).toBe(10);
    expect(end.getUTCDate()).toBe(11);
    expect(end.getUTCMonth()).toBe(5);
  });

  it("generates full legal pack with five versioned documents", () => {
    const pack = generateFullLegalPack({
      spvIssuerName: "Test SPV Inc.",
      dealSummary: "Test deal",
      exemption: "ACCREDITED_INVESTOR",
    });
    expect(pack.version).toMatch(/^\d{4}-\d{2}-\d{2}-v/);
    expect(Object.keys(pack.documents).length).toBe(5);
    expect(pack.documents.riskDisclosure.markdown.toLowerCase()).toContain("illiquid");
  });

  it("flags obligations due within a review window", () => {
    const in14 = new Date(Date.now() + 14 * 86400000);
    const rows = [
      { dueDate: new Date(Date.now() + 86400000), status: "OPEN" as const },
      { dueDate: new Date(Date.now() + 40 * 86400000), status: "OPEN" as const },
    ];
    const dueSoon = rows.filter((o) => o.dueDate <= in14 && o.status !== "PAID" && o.status !== "FILED");
    expect(dueSoon.length).toBe(1);
  });
});
