import { describe, expect, it, vi } from "vitest";

const { mockFindMany } = vi.hoisted(() => ({
  mockFindMany: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    executiveReportSchedule: {
      findMany: mockFindMany,
      update: vi.fn(),
    },
  },
}));

import { runScheduledReports } from "../report-scheduler.service";

describe("runScheduledReports", () => {
  beforeEach(() => {
    mockFindMany.mockReset();
  });

  it("returns zeros when no schedules", async () => {
    mockFindMany.mockResolvedValueOnce([]);
    const r = await runScheduledReports(new Date("2026-04-23T12:00:00Z"));
    expect(r.processed).toBe(0);
    expect(r.generated).toBe(0);
    expect(r.emailed).toBe(0);
  });
});
