import { describe, expect, it } from "vitest";
import {
  computeFunnelRates,
  recordFunnelEvent,
  resetFunnelMetricsForTests,
} from "@/modules/conversion/funnel-metrics.service";

describe("funnel-metrics visibility", () => {
  it("computes CTR and conversion ratios from captured events", () => {
    resetFunnelMetricsForTests();
    recordFunnelEvent("homepage", "page_view");
    recordFunnelEvent("homepage", "page_view");
    recordFunnelEvent("homepage", "CTA_click");
    recordFunnelEvent("get_leads", "form_start");
    recordFunnelEvent("get_leads", "form_submit");

    const r = computeFunnelRates();
    expect(r.homepage_ctr).toBeCloseTo(50);
    expect(r.get_leads_form_conversion).toBeCloseTo(100);
  });

  it("property conversion uses property_view as denominator", () => {
    resetFunnelMetricsForTests();
    recordFunnelEvent("property", "property_view");
    recordFunnelEvent("property", "property_view");
    recordFunnelEvent("property", "contact_click");
    const r = computeFunnelRates();
    expect(r.property_contact_rate).toBeCloseTo(50);
  });
});
