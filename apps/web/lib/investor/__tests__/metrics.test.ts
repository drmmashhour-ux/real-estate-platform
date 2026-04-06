import { describe, expect, it, vi, beforeEach } from "vitest";
import { getDateRangeForWindow, parseInvestorTimeWindow } from "../metrics";
import { canAccessInvestorDashboard } from "../access";

describe("parseInvestorTimeWindow", () => {
  it("accepts valid windows", () => {
    expect(parseInvestorTimeWindow("7d")).toBe("7d");
    expect(parseInvestorTimeWindow("all")).toBe("all");
    expect(parseInvestorTimeWindow("today")).toBe("today");
  });

  it("defaults invalid or missing to 30d", () => {
    expect(parseInvestorTimeWindow(undefined)).toBe("30d");
    expect(parseInvestorTimeWindow("")).toBe("30d");
    expect(parseInvestorTimeWindow("invalid")).toBe("30d");
  });
});

describe("getDateRangeForWindow", () => {
  it("all time has null start", () => {
    const r = getDateRangeForWindow("all");
    expect(r.start).toBeNull();
    expect(r.label).toContain("All");
  });

  it("7d has start before end", () => {
    const r = getDateRangeForWindow("7d");
    expect(r.start).not.toBeNull();
    if (r.start) {
      expect(r.start.getTime()).toBeLessThan(r.end.getTime());
    }
  });
});

describe("canAccessInvestorDashboard", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns false for null userId", async () => {
    expect(await canAccessInvestorDashboard(null)).toBe(false);
  });

  it("allows ADMIN", async () => {
    const { prisma } = await import("@/lib/db");
    vi.spyOn(prisma.user, "findUnique").mockResolvedValue({ role: "ADMIN" } as never);
    expect(await canAccessInvestorDashboard("u1")).toBe(true);
  });

  it("denies USER", async () => {
    const { prisma } = await import("@/lib/db");
    vi.spyOn(prisma.user, "findUnique").mockResolvedValue({ role: "USER" } as never);
    expect(await canAccessInvestorDashboard("u1")).toBe(false);
  });
});

describe("unavailable metrics policy", () => {
  it("snapshot type documents omitted conversion metrics", async () => {
    const { fetchInvestorMetricsSnapshot } = await import("../metrics");
    const { prisma } = await import("@/lib/db");

    vi.spyOn(prisma.shortTermListing, "count").mockResolvedValue(0);
    vi.spyOn(prisma.shortTermListing, "groupBy").mockResolvedValue([] as never);
    vi.spyOn(prisma.bnhubHostListingPromotion, "count").mockResolvedValue(0);
    vi.spyOn(prisma.managerAiHostAutopilotSettings, "count").mockResolvedValue(0);
    vi.spyOn(prisma.booking, "count").mockResolvedValue(0);
    vi.spyOn(prisma.booking, "aggregate").mockResolvedValue({ _sum: { totalCents: null } } as never);
    vi.spyOn(prisma.payment, "aggregate").mockResolvedValue({ _sum: { platformFeeCents: null } } as never);
    vi.spyOn(prisma.bnhubHostPayoutRecord, "aggregate").mockResolvedValue({
      _sum: { platformFeeCents: null, netAmountCents: null },
      _count: { _all: 0 },
    } as never);
    vi.spyOn(prisma.bnhubHostPayoutRecord, "findMany").mockResolvedValue([] as never);
    vi.spyOn(prisma.managerAiRecommendation, "count").mockResolvedValue(0);
    vi.spyOn(prisma.managerAiApprovalRequest, "count").mockResolvedValue(0);
    vi.spyOn(prisma.managerAiActionLog, "count").mockResolvedValue(0);
    vi.spyOn(prisma.managerAiActionLog, "groupBy").mockResolvedValue([] as never);
    vi.spyOn(prisma.managerAiOverrideEvent, "count").mockResolvedValue(0);
    vi.spyOn(prisma.managerAiHealthEvent, "count").mockResolvedValue(0);
    vi.spyOn(prisma.managerAiAgentRun, "count").mockResolvedValue(0);
    vi.spyOn(prisma.user, "groupBy").mockResolvedValue([] as never);
    vi.spyOn(prisma.platformMarketLaunchSettings, "findUnique").mockResolvedValue(null);

    const snap = await fetchInvestorMetricsSnapshot("30d");
    expect(snap.unavailable.length).toBeGreaterThan(0);
    expect(snap.revenue.bookingTotalCentsGmvProxyInRange).toBeNull();
  });
});
