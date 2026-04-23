import { describe, expect, it, beforeEach } from "vitest";

import {
  buildLeadDashboardStats,
  captureLead,
  listLeads,
  resetGrowthLeadsStoreForTests,
  updateLeadLifecycle,
} from "@/modules/growth-leads/leads-capture.service";
import { routeLead } from "@/modules/growth-leads/leads-routing.service";
import { scoreLead } from "@/modules/growth-leads/leads-scoring.service";

describe("growth-leads", () => {
  beforeEach(() => {
    resetGrowthLeadsStoreForTests();
  });

  it("captures lead with score and route", () => {
    const lead = captureLead({
      intent: "BUYER",
      source: "LISTING_PAGE",
      email: "a@b.co",
      behaviors: { listingViews: 6, clickedCta: true },
    });
    expect(lead.intentLevel).toMatch(/LOW|MEDIUM|HIGH/);
    expect(lead.route.target).toBeTruthy();
    expect(listLeads().length).toBe(1);
  });

  it("scores HIGH with strong behaviors", () => {
    const level = scoreLead({
      intent: "BUYER",
      source: "BNHUB_BOOKING",
      behaviors: { listingViews: 8, clickedCta: true, timeOnSiteSeconds: 200, repeatSession: true },
    });
    expect(level).toBe("HIGH");
  });

  it("routes investor to investor pipeline", () => {
    const r = routeLead({ intent: "INVESTOR", source: "FORM" }, "MEDIUM");
    expect(r.target).toBe("INVESTOR_PIPELINE");
  });

  it("routes high buyer to top broker tier", () => {
    const r = routeLead({ intent: "BUYER", source: "LISTING_PAGE" }, "HIGH");
    expect(r.target).toBe("BROKER");
    expect(r.brokerTier).toBe("top");
  });

  it("routes broker intent to internal sales", () => {
    const r = routeLead({ intent: "BROKER", source: "LANDING_PAGE" }, "LOW");
    expect(r.target).toBe("INTERNAL_SALES");
  });

  it("dashboard stats conversion rate", () => {
    captureLead({ intent: "BUYER", source: "FORM", email: "x@y.z" });
    const leads = listLeads();
    const id = leads[0]!.id;
    updateLeadLifecycle(id, "CONVERTED");
    const all = listLeads();
    const stats = buildLeadDashboardStats(all);
    expect(stats.totalLeads).toBe(1);
    expect(stats.winRateVsAll).toBe(1);
  });
});
