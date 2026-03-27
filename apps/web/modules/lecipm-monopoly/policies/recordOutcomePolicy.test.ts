import { describe, expect, it } from "vitest";
import { LecipmWorkspaceRole } from "@prisma/client";
import { canRecordDealOutcome } from "./recordOutcomePolicy";

describe("canRecordDealOutcome", () => {
  it("allows platform admin", () => {
    expect(
      canRecordDealOutcome({
        isPlatformAdmin: true,
        role: LecipmWorkspaceRole.viewer,
        userId: "u1",
        dealBrokerId: "other",
      })
    ).toBe(true);
  });

  it("allows manage_listings", () => {
    expect(
      canRecordDealOutcome({
        isPlatformAdmin: false,
        role: LecipmWorkspaceRole.manager,
        userId: "u1",
        dealBrokerId: "other",
      })
    ).toBe(true);
  });

  it("allows assigned broker", () => {
    expect(
      canRecordDealOutcome({
        isPlatformAdmin: false,
        role: LecipmWorkspaceRole.broker,
        userId: "u1",
        dealBrokerId: "u1",
      })
    ).toBe(true);
  });

  it("denies viewer on others deals", () => {
    expect(
      canRecordDealOutcome({
        isPlatformAdmin: false,
        role: LecipmWorkspaceRole.viewer,
        userId: "u1",
        dealBrokerId: "other",
      })
    ).toBe(false);
  });
});
