import { describe, it, expect, vi, beforeEach } from "vitest";
import { assertBrokeredTransaction } from "../compliance-action-guard";
import { getAllowedCapabilities } from "../compliance-capability-guard";
import type { TransactionContext } from "../transaction-context.types";
import { LECIPM_BROKER_REQUIRED_MESSAGE } from "../transaction-context.types";

vi.mock("../legal-boundary-audit.service", () => ({
  writeLegalBoundaryAudit: vi.fn().mockResolvedValue(undefined),
}));

function baseContext(over: Partial<TransactionContext>): TransactionContext {
  return {
    id: "ctx1",
    entityType: "LISTING",
    entityId: "lst_1",
    mode: "FSBO",
    brokerId: null,
    complianceState: "SAFE",
    modeSource: "AUTO",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...over,
  };
}

describe("getAllowedCapabilities", () => {
  it("grants brokerage automation only in BROKERED mode", () => {
    const fsbo = getAllowedCapabilities(baseContext({ mode: "FSBO" }));
    expect(fsbo.negotiationAi).toBe(false);
    expect(fsbo.offerGenerator).toBe(false);
    expect(fsbo.contractGeneration).toBe(false);
    expect(fsbo.listingDisplay).toBe(true);
    expect(fsbo.neutralMessaging).toBe(true);

    const br = getAllowedCapabilities(
      baseContext({ mode: "BROKERED", brokerId: "broker_1" }),
    );
    expect(br.negotiationAi).toBe(true);
    expect(br.contractGeneration).toBe(true);
  });
});

describe("assertBrokeredTransaction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("blocks offers in FSBO mode", async () => {
    const res = await assertBrokeredTransaction(baseContext({ mode: "FSBO" }), "create_offer", "u1");
    expect(res).not.toBeNull();
    expect(res?.status).toBe(403);
    const body = await res!.json();
    expect(body.error).toBe(LECIPM_BROKER_REQUIRED_MESSAGE);
  });

  it("allows brokered mode", async () => {
    const res = await assertBrokeredTransaction(
      baseContext({ mode: "BROKERED", brokerId: "b1" }),
      "create_offer",
      "u1",
    );
    expect(res).toBeNull();
  });

  it("blocks on compliance hold even if mode were brokered", async () => {
    const res = await assertBrokeredTransaction(
      baseContext({ mode: "BROKERED", brokerId: "b1", complianceState: "BLOCKED" }),
      "create_offer",
      "u1",
    );
    expect(res?.status).toBe(403);
  });
});
