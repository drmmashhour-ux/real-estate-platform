import { beforeEach, describe, expect, it, vi } from "vitest";

const mockQuery = vi.fn();
const mockExperimentFindUnique = vi.fn();
const mockAssignmentFindUnique = vi.fn();
const mockCreate = vi.fn();
const mockEventCreate = vi.fn();
const mockCount = vi.fn();
const mockFindMany = vi.fn();

vi.mock("@/lib/sql", () => ({
  query: (...a: unknown[]) => mockQuery(...a),
}));
vi.mock("@/lib/db/legacy", () => ({
  getLegacyDB: () => ({
    experiment: { findUnique: mockExperimentFindUnique },
    experimentAssignment: { findUnique: mockAssignmentFindUnique, create: mockCreate },
    experimentEvent: { create: mockEventCreate, count: mockCount, findMany: mockFindMany },
  }),
}));
vi.mock("@/lib/flags", () => ({
  flags: { RECOMMENDATIONS: true, AI_PRICING: false, AUTONOMOUS_AGENT: false },
}));

describe("detectExperimentWinner", () => {
  it("returns null when both arms are under 30 users", async () => {
    const { detectExperimentWinner } = await import("@/lib/experiments/engine");
    const w = detectExperimentWinner([
      { variantKey: "A", users: 10, conversionRate: 0.2 },
      { variantKey: "B", users: 10, conversionRate: 0.1 },
    ]);
    expect(w.key).toBeNull();
  });

  it("picks A when A has 30+ users and 20% relative lift over B", async () => {
    const { detectExperimentWinner } = await import("@/lib/experiments/engine");
    const w = detectExperimentWinner([
      { variantKey: "A", users: 50, conversionRate: 0.13 },
      { variantKey: "B", users: 40, conversionRate: 0.1 },
    ]);
    expect(w.key).toBe("A");
    expect(w.confidence).toBe("medium");
  });

  it("does not pick a winner if lift is below 20% relative", async () => {
    const { detectExperimentWinner } = await import("@/lib/experiments/engine");
    const w = detectExperimentWinner([
      { variantKey: "A", users: 50, conversionRate: 0.11 },
      { variantKey: "B", users: 40, conversionRate: 0.1 },
    ]);
    expect(w.key).toBeNull();
  });

  it("is conservative on confidence when the other arm is under 30", async () => {
    const { detectExperimentWinner } = await import("@/lib/experiments/engine");
    const w = detectExperimentWinner([
      { variantKey: "A", users: 35, conversionRate: 0.2 },
      { variantKey: "B", users: 10, conversionRate: 0.1 },
    ]);
    if (w.key === "A") {
      expect(w.confidence).toBe("low");
    }
  });
});

describe("getExperimentVariant (Order 59)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when experiment is not running", async () => {
    mockExperimentFindUnique.mockResolvedValueOnce({
      id: "e1",
      slug: "x",
      status: "draft",
      variants: [
        { id: "v1", variantKey: "A", name: "A", weight: 50 },
        { id: "v2", variantKey: "B", name: "B", weight: 50 },
      ],
    });
    const { getExperimentVariant } = await import("@/lib/experiments/engine");
    const v = await getExperimentVariant("u1", "x");
    expect(v).toBeNull();
  });

  it("returns same arm when assignment exists", async () => {
    mockExperimentFindUnique.mockResolvedValueOnce({
      id: "e1",
      slug: "x",
      status: "running",
      variants: [
        { id: "v1", variantKey: "A", name: "Label A", weight: 50 },
        { id: "v2", variantKey: "B", name: "B", weight: 50 },
      ],
    });
    mockAssignmentFindUnique.mockResolvedValueOnce({
      variantId: "v2",
      variant: { id: "v2", variantKey: "B", name: "Label B" },
    });
    const { getExperimentVariant } = await import("@/lib/experiments/engine");
    const v = await getExperimentVariant("u1", "x");
    expect(v?.variantKey).toBe("B");
    expect(mockCreate).not.toHaveBeenCalled();
  });
});
