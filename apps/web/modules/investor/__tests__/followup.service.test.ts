import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  prisma: {
    fundraisingInvestor: {
      findMany: vi.fn(),
    },
    user: {
      count: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/db";
import {
  defaultNextFollowUpDate,
  getExecutionMomentum,
  listInvestorsDueForFollowUp,
} from "../followup.service";

describe("followup.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("defaultNextFollowUpDate adds default days from playbook", () => {
    const base = new Date("2026-06-01T12:00:00.000Z");
    const next = defaultNextFollowUpDate(base);
    expect(next.getTime() - base.getTime()).toBe(4 * 86400000);
  });

  it("listInvestorsDueForFollowUp includes scheduled overdue", async () => {
    const now = new Date("2026-06-10T12:00:00.000Z");
    vi.mocked(prisma.fundraisingInvestor.findMany).mockImplementation(async (args: { where?: { nextFollowUpAt?: unknown } }) => {
      if (args.where?.nextFollowUpAt) {
        return [
          {
            id: "a",
            name: "Alex",
            email: "a@x.com",
            firm: "X",
            stage: "meeting",
            nextFollowUpAt: new Date("2026-06-01"),
            interactions: [{ createdAt: new Date("2026-06-02") }],
          },
        ] as never;
      }
      return [] as never;
    });

    const due = await listInvestorsDueForFollowUp(now);
    expect(due.some((d) => d.id === "a" && d.reason === "scheduled_overdue")).toBe(true);
  });

  it("getExecutionMomentum returns broker count", async () => {
    vi.mocked(prisma.user.count).mockResolvedValue(12);
    const m = await getExecutionMomentum();
    expect(m.brokerAccounts).toBe(12);
    expect(m.disclaimer).toContain("Operator-only");
  });
});
