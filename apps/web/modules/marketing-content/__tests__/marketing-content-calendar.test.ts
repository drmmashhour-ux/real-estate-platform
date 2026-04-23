import { describe, expect, it, beforeEach } from "vitest";

import type { ContentItem } from "@/modules/marketing-content/content-calendar.types";
import { resetMarketingContentStoreForTests } from "@/modules/marketing-content/content-calendar-storage";
import {
  advanceStatus,
  canTransition,
  createContentItem,
  listContentItems,
  refreshNotifications,
  rescheduleContent,
  updateContentItem,
} from "@/modules/marketing-content/content-calendar.service";
import {
  buildMarketingContentDashboardSummaryFromItems,
  updatePerformance,
} from "@/modules/marketing-content/content-performance.service";

function seedItem(partial?: Partial<ContentItem>): ContentItem {
  const base = createContentItem({
    title: "Test",
    type: "VIDEO",
    platform: "INSTAGRAM",
    audience: "GENERAL",
    goal: "AWARENESS",
    ...partial,
  });
  return base;
}

describe("marketing-content calendar", () => {
  beforeEach(() => {
    resetMarketingContentStoreForTests();
  });

  it("enforces adjacent status transitions", () => {
    expect(canTransition("IDEA", "DRAFT")).toBe(true);
    expect(canTransition("IDEA", "APPROVED")).toBe(false);
    expect(canTransition("POSTED", "POSTED")).toBe(true);
  });

  it("advances workflow and sets postedDate when moving to POSTED", () => {
    let itm = seedItem({});
    expect(itm.status).toBe("IDEA");
    while (itm.status !== "POSTED") {
      const n = advanceStatus(itm);
      expect(n).not.toBeNull();
      itm = n!;
    }
    expect(itm.postedDate).toBeTruthy();
  });

  it("scheduling via rescheduleContent moves pre-approved rows to SCHEDULED", () => {
    let itm = seedItem({ status: "DRAFT" });
    const updated = rescheduleContent(itm.id, "2026-06-01");
    expect(updated?.scheduledDate).toBe("2026-06-01");
    expect(updated?.status).toBe("SCHEDULED");
  });

  it("reject invalid status jumps on updateContentItem", () => {
    const itm = seedItem({ status: "IDEA" });
    const bad = updateContentItem(itm.id, { status: "POSTED" });
    expect(bad).toBeNull();
  });

  it("allows jump to SCHEDULED when scheduling date is provided", () => {
    const itm = seedItem({ status: "IDEA" });
    const ok = updateContentItem(itm.id, {
      status: "SCHEDULED",
      scheduledDate: "2026-04-10",
    });
    expect(ok?.status).toBe("SCHEDULED");
    expect(ok?.scheduledDate).toBe("2026-04-10");
  });

  it("aggregates dashboard summary & best performer", () => {
    const a = seedItem({
      title: "A",
      status: "POSTED",
      scheduledDate: "2026-04-02",
      postedDate: "2026-04-02T10:00:00.000Z",
    });
    updatePerformance(a.id, { views: 1000, clicks: 40, leads: 2, revenueCents: 50000 });
    const b = seedItem({
      title: "B",
      status: "POSTED",
      scheduledDate: "2026-03-01",
      postedDate: "2026-03-01T12:00:00.000Z",
    });
    updatePerformance(b.id, { views: 100, clicks: 5, leads: 0, revenueCents: 0 });

    const sum = buildMarketingContentDashboardSummaryFromItems(
      listContentItems(),
      new Date("2026-04-02T12:00:00.000Z")
    );
    expect(sum.leadsFromContent).toBe(2);
    expect(sum.revenueFromContentCents).toBe(50000);
    expect(sum.bestPerforming?.title).toBe("A");
  });

  it("refreshNotifications surfaces missing slot", () => {
    seedItem({ scheduledDate: "2099-01-01", status: "SCHEDULED" });
    const notes = refreshNotifications();
    expect(notes.some((n) => n.kind === "missing_slot")).toBe(true);
  });
});
