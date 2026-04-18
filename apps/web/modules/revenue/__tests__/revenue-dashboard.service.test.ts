import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => {
  const revenueEvent = {
    findMany: vi.fn(),
    count: vi.fn(),
  };
  const lead = { count: vi.fn() };
  const user = { count: vi.fn() };
  const aiConversionSignal = { count: vi.fn() };
  return {
    prisma: { revenueEvent, lead, user, aiConversionSignal },
  };
});

vi.mock("@/modules/revenue/revenue-monitoring.service", () => ({
  getRevenueMonitoringSnapshot: vi.fn(() => ({
    eventsLogged: 0,
    blockedAccessCount: 0,
    unlockAttempts: 0,
    unlockSuccess: 0,
    leadViews: 0,
    leadsUnlockedPipeline: 0,
    contactRevealed: 0,
    bookingStarted: 0,
    bookingCompleted: 0,
    premiumInsightViews: 0,
    byEventType: {},
  })),
}));

import { prisma } from "@/lib/db";
import { buildRevenueDashboardSummary } from "../revenue-dashboard.service";
import { resetRevenueDashboardMonitoringForTests } from "../revenue-dashboard-monitoring.service";

describe("buildRevenueDashboardSummary", () => {
  beforeEach(() => {
    vi.mocked(prisma.revenueEvent.findMany).mockResolvedValue([
      { eventType: "lead_unlock", amount: 10 },
      { eventType: "booking_fee", amount: 5 },
    ]);
    vi.mocked(prisma.revenueEvent.count).mockResolvedValue(0);
    vi.mocked(prisma.lead.count).mockResolvedValueOnce(4).mockResolvedValueOnce(1);
    vi.mocked(prisma.user.count).mockResolvedValue(2);
    vi.mocked(prisma.aiConversionSignal.count).mockResolvedValue(0);
    resetRevenueDashboardMonitoringForTests();
  });

  it("aggregates revenue by source and safe rates", async () => {
    const s = await buildRevenueDashboardSummary();
    expect(s.revenueBySource.lead_unlock).toBeGreaterThan(0);
    expect(s.revenueBySource.booking_fee).toBeGreaterThan(0);
    expect(s.leadUnlockRate).toBeGreaterThanOrEqual(0);
    expect(s.leadUnlockRate).toBeLessThanOrEqual(1);
    expect(s.bookingCompletionRate).toBeGreaterThanOrEqual(0);
    expect(s.bookingCompletionRate).toBeLessThanOrEqual(1);
    expect(Array.isArray(s.notes)).toBe(true);
    expect(Array.isArray(s.alerts)).toBe(true);
  });

  it("uses safe denominator when no lead views (unlock rate 0–1)", async () => {
    vi.mocked(prisma.revenueEvent.findMany).mockResolvedValue([]);
    vi.mocked(prisma.revenueEvent.count).mockResolvedValue(0);
    vi.mocked(prisma.lead.count).mockReset();
    vi.mocked(prisma.lead.count).mockResolvedValueOnce(0).mockResolvedValueOnce(0);
    vi.mocked(prisma.user.count).mockResolvedValue(0);
    vi.mocked(prisma.aiConversionSignal.count).mockResolvedValue(0);
    const s = await buildRevenueDashboardSummary();
    expect(s.leadsViewed).toBe(0);
    expect(s.leadUnlockRate).toBe(0);
  });

  it("booking completion rate is safe when no starts", async () => {
    vi.mocked(prisma.aiConversionSignal.count).mockResolvedValueOnce(0).mockResolvedValueOnce(0);
    const s = await buildRevenueDashboardSummary();
    expect(s.bookingStarts).toBe(0);
    expect(s.bookingCompletionRate).toBe(0);
  });
});
