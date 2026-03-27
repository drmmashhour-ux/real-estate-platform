import { describe, expect, it } from "vitest";
import { BnhubLeadSourceType, BnhubLeadTemperature } from "@prisma/client";
import { computeSpamSignals, scoreLead } from "./leadEngineService";

describe("leadEngineService", () => {
  it("scores hot lead with rich payload", () => {
    const { score, temperature } = scoreLead({
      sourceType: BnhubLeadSourceType.META_LEAD,
      email: "a@b.com",
      phone: "+15145550100",
      message: "We need a place for a week in July with flexible check-in.",
      travelDatesJson: { start: "2026-07-01" },
      budgetMinCents: 100_00,
      budgetMaxCents: 200_00,
      guestCount: 4,
    });
    expect(score).toBeGreaterThanOrEqual(70);
    expect(temperature).toBe(BnhubLeadTemperature.HOT);
  });

  it("scores cold for sparse lead", () => {
    const { temperature } = scoreLead({
      sourceType: BnhubLeadSourceType.MANUAL,
    });
    expect(temperature).toBe(BnhubLeadTemperature.COLD);
  });

  it("detects disposable email in spam signals", () => {
    const { spamScore, reasons } = computeSpamSignals({
      sourceType: BnhubLeadSourceType.INTERNAL_FORM,
      email: "x@mailinator.com",
    });
    expect(spamScore).toBeGreaterThanOrEqual(40);
    expect(reasons).toContain("disposable_email_domain");
  });
});
