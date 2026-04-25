import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  prisma: {
    lecipmBrokerCrmLead: { findUnique: vi.fn() },
  },
}));

describe("tryAssignPlaybookForBrokerLeadSuggestions", () => {
  it("returns null for empty lead id without throwing", async () => {
    const { tryAssignPlaybookForBrokerLeadSuggestions } = await import("./broker-crm-playbook.service");
    const r = await tryAssignPlaybookForBrokerLeadSuggestions("");
    expect(r).toBeNull();
  });
});
