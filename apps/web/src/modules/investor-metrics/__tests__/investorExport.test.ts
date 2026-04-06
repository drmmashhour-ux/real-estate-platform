import type { MetricSnapshot } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { buildMetricSnapshotsCsv, csvEscapeField } from "../investorExport";

function snap(p: Partial<MetricSnapshot> & Pick<MetricSnapshot, "date">): MetricSnapshot {
  return {
    id: p.id ?? "id",
    date: p.date,
    totalUsers: p.totalUsers ?? 0,
    activeUsers: p.activeUsers ?? 0,
    totalListings: p.totalListings ?? 0,
    bookings: p.bookings ?? 0,
    revenue: p.revenue ?? 0,
    conversionRate: p.conversionRate ?? 0,
    createdAt: p.createdAt ?? new Date("2026-01-01T00:00:00.000Z"),
  };
}

describe("investorExport", () => {
  it("csvEscapeField quotes commas and newlines", () => {
    expect(csvEscapeField("ok")).toBe("ok");
    expect(csvEscapeField('say "hi"')).toBe('"say ""hi"""');
    expect(csvEscapeField("a,b")).toBe('"a,b"');
    expect(csvEscapeField("line\nbreak")).toBe('"line\nbreak"');
  });

  it("buildMetricSnapshotsCsv sorts chronologically and includes header", () => {
    const csv = buildMetricSnapshotsCsv([
      snap({ date: new Date("2026-03-02"), totalUsers: 2 }),
      snap({ date: new Date("2026-03-01"), totalUsers: 1 }),
    ]);
    const lines = csv.split("\n");
    expect(lines[0]).toBe(
      "date,total_users,active_users,total_listings,bookings_30d,revenue_30d,conversion_rate"
    );
    expect(lines[1]).toMatch(/^2026-03-01,/);
    expect(lines[2]).toMatch(/^2026-03-02,/);
  });
});
