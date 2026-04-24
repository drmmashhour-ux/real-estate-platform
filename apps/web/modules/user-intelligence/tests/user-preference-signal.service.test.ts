import { describe, expect, it, vi, beforeEach } from "vitest";

const { create, findMany } = vi.hoisted(() => ({
  create: vi.fn(),
  findMany: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    userPreferenceSignal: { create, findMany },
  },
}));

import { recordSignal, listSignals } from "../services/user-preference-signal.service";

beforeEach(() => {
  create.mockReset();
  findMany.mockReset();
  create.mockResolvedValue({ id: "s1" });
  findMany.mockResolvedValue([{ id: "a", signalKey: "x", createdAt: new Date(), explicitUserProvided: true }]);
});

describe("user-preference-signal.service", () => {
  it("rejects protected-trait style keys in recordSignal", async () => {
    const r = await recordSignal({
      userId: "u1",
      sourceDomain: "X",
      sourceType: "Y",
      signalKey: "nationality_guess",
      signalValue: "x",
    });
    expect(r.ok).toBe(false);
    expect(create).not.toHaveBeenCalled();
  });

  it("records safe keys", async () => {
    const r = await recordSignal({
      userId: "u1",
      sourceDomain: "DREAM_HOME",
      sourceType: "q",
      signalKey: "dream_home_city",
      signalValue: "montreal",
      explicitUserProvided: true,
    });
    expect(r.ok).toBe(true);
    expect(create).toHaveBeenCalled();
  });

  it("listSignals returns data", async () => {
    const r = await listSignals("u1", 10);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.length).toBe(1);
    }
  });
});
