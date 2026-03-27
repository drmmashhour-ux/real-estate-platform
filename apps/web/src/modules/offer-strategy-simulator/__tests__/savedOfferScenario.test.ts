import { describe, expect, it, vi, beforeEach } from "vitest";
import { prisma } from "@/lib/db";
import { saveOfferScenario } from "@/src/modules/offer-strategy-simulator/application/saveOfferScenario";
import { getOfferScenarioHistory } from "@/src/modules/offer-strategy-simulator/application/getOfferScenarioHistory";
import { selectOfferScenario } from "@/src/modules/offer-strategy-simulator/application/selectOfferScenario";
import { compareSavedOfferScenarios } from "@/src/modules/offer-strategy-simulator/application/compareSavedOfferScenarios";
import { deleteOfferScenario } from "@/src/modules/offer-strategy-simulator/application/deleteOfferScenario";
import { SimulationConfidence } from "@/src/modules/offer-strategy-simulator/domain/offerStrategy.enums";
import { ImpactBand } from "@/src/modules/offer-strategy-simulator/domain/offerStrategy.enums";

vi.mock("@/lib/db", () => ({
  prisma: {
    offerStrategyScenario: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      updateMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

const sampleOutput = {
  dealImpact: { score: 50, band: ImpactBand.Neutral, summary: "" },
  leverageImpact: { score: 50, band: ImpactBand.Neutral, summary: "" },
  riskImpact: { score: 40, band: ImpactBand.Neutral, summary: "" },
  readinessImpact: { score: 60, band: ImpactBand.Neutral, summary: "" },
  recommendedStrategy: "x",
  keyWarnings: [],
  recommendedProtections: [],
  nextActions: [],
  confidence: SimulationConfidence.High,
  disclaimer: "d",
};

const sampleInput = {
  propertyId: "p1",
  offerPriceCents: 100_000,
  depositAmountCents: 5000,
  financingCondition: true,
  inspectionCondition: true,
  documentReviewCondition: true,
  occupancyDate: null,
  signatureDate: null,
  userStrategyMode: null,
};

describe("saved offer scenarios", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("saveOfferScenario persists JSON payloads", async () => {
    vi.mocked(prisma.offerStrategyScenario.create).mockResolvedValue({
      id: "s1",
      propertyId: "p1",
      caseId: "c1",
      userId: "u1",
      scenarioLabel: "Test",
      inputPayload: sampleInput,
      outputPayload: sampleOutput,
      selected: false,
      notes: null,
      createdAt: new Date("2025-01-01"),
      updatedAt: new Date("2025-01-01"),
    } as never);

    const dto = await saveOfferScenario({
      userId: "u1",
      propertyId: "p1",
      caseId: "c1",
      scenarioLabel: "Test",
      input: sampleInput,
      output: sampleOutput as never,
    });

    expect(dto.id).toBe("s1");
    expect(prisma.offerStrategyScenario.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          propertyId: "p1",
          caseId: "c1",
          userId: "u1",
          scenarioLabel: "Test",
        }),
      }),
    );
  });

  it("getOfferScenarioHistory filters by case when provided", async () => {
    vi.mocked(prisma.offerStrategyScenario.findMany).mockResolvedValue([]);
    await getOfferScenarioHistory({ userId: "u1", propertyId: "p1", caseId: "c1" });
    expect(prisma.offerStrategyScenario.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { propertyId: "p1", userId: "u1", caseId: "c1" },
      }),
    );
  });

  it("selectOfferScenario clears others in the same case scope", async () => {
    vi.mocked(prisma.offerStrategyScenario.findFirst).mockResolvedValue({
      id: "s1",
    } as never);
    vi.mocked(prisma.offerStrategyScenario.findUniqueOrThrow).mockResolvedValue({
      id: "s1",
      propertyId: "p1",
      caseId: "c1",
      userId: "u1",
      scenarioLabel: "Test",
      inputPayload: sampleInput,
      outputPayload: sampleOutput,
      selected: true,
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);
    vi.mocked(prisma.$transaction).mockImplementation(async (arg: unknown) => {
      const ops = arg as unknown[];
      for (const op of ops) await op;
    });

    const out = await selectOfferScenario({
      userId: "u1",
      scenarioId: "s1",
      propertyId: "p1",
      caseId: "c1",
    });
    expect(out.ok).toBe(true);
    expect(prisma.offerStrategyScenario.updateMany).toHaveBeenCalled();
    expect(prisma.offerStrategyScenario.update).toHaveBeenCalled();
  });

  it("compareSavedOfferScenarios returns a deterministic summary", async () => {
    vi.mocked(prisma.offerStrategyScenario.findFirst)
      .mockResolvedValueOnce({
        id: "a",
        propertyId: "p1",
        caseId: "c1",
        userId: "u1",
        scenarioLabel: "A",
        inputPayload: sampleInput,
        outputPayload: sampleOutput,
        selected: false,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as never)
      .mockResolvedValueOnce({
        id: "b",
        propertyId: "p1",
        caseId: "c1",
        userId: "u1",
        scenarioLabel: "B",
        inputPayload: sampleInput,
        outputPayload: { ...sampleOutput, dealImpact: { ...sampleOutput.dealImpact, score: 60 } },
        selected: false,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as never);

    const out = await compareSavedOfferScenarios({ userId: "u1", propertyId: "p1", idA: "a", idB: "b" });
    expect(out.ok).toBe(true);
    if (out.ok) {
      expect(out.comparison.summary).toContain("Stored snapshot comparison only");
      expect(out.comparison.summary).toContain("Δ");
    }
  });

  it("deleteOfferScenario removes owned row", async () => {
    vi.mocked(prisma.offerStrategyScenario.findFirst).mockResolvedValue({ id: "s1" } as never);
    vi.mocked(prisma.offerStrategyScenario.delete).mockResolvedValue({} as never);
    const out = await deleteOfferScenario({ userId: "u1", scenarioId: "s1", propertyId: "p1" });
    expect(out.ok).toBe(true);
    expect(prisma.offerStrategyScenario.delete).toHaveBeenCalledWith({ where: { id: "s1" } });
  });
});
