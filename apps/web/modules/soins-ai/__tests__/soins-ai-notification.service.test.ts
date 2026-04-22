import { beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "@/lib/db";

import { evaluateSoinsRisk } from "../soins-ai-risk.service";
import { planSoinsAiNotifications } from "../soins-ai-notification.service";

vi.mock("@/lib/db", () => ({
  prisma: {
    familyAccess: {
      findMany: vi.fn(),
    },
  },
}));

describe("planSoinsAiNotifications", () => {
  beforeEach(() => {
    vi.mocked(prisma.familyAccess.findMany).mockReset();
  });

  it("includes only family with canReceiveAlerts", async () => {
    vi.mocked(prisma.familyAccess.findMany).mockResolvedValue([
      {
        familyUserId: "u1",
        canReceiveAlerts: true,
        canViewCamera: false,
        resident: { residence: { operatorId: "op1" } },
      },
      {
        familyUserId: "u2",
        canReceiveAlerts: false,
        canViewCamera: true,
        resident: { residence: { operatorId: "op1" } },
      },
    ] as never);

    const assessment = evaluateSoinsRisk({
      residentId: "r1",
      signalCounts: { MOVEMENT_MISSED: 1 },
      familyConcernLevel: "none",
    });

    const plan = await planSoinsAiNotifications({ residentId: "r1", assessment });

    expect(plan.familyNotifyUserIds).toEqual(["u1"]);
    expect(plan.residenceOperatorUserId).toBe("op1");
  });

  it("scopes camera audience when assessment touches camera infrastructure", async () => {
    vi.mocked(prisma.familyAccess.findMany).mockResolvedValue([
      {
        familyUserId: "u1",
        canReceiveAlerts: true,
        canViewCamera: false,
        resident: { residence: { operatorId: null } },
      },
      {
        familyUserId: "u2",
        canReceiveAlerts: true,
        canViewCamera: true,
        resident: { residence: { operatorId: null } },
      },
    ] as never);

    const assessment = evaluateSoinsRisk({
      residentId: "r1",
      signalCounts: { ABNORMAL_ACTIVITY: 1 },
      cameraInactive: true,
      familyConcernLevel: "none",
    });

    const plan = await planSoinsAiNotifications({ residentId: "r1", assessment });

    expect(assessment.reasons.some((x) => /camera/i.test(x))).toBe(true);
    expect(plan.familyCameraNotifyUserIds).toEqual(["u2"]);
    expect(plan.suppressed.some((s) => s.audience === "family_camera_channel")).toBe(false);
  });

  it("suppresses camera channel copy when nobody has camera permission", async () => {
    vi.mocked(prisma.familyAccess.findMany).mockResolvedValue([
      {
        familyUserId: "u1",
        canReceiveAlerts: true,
        canViewCamera: false,
        resident: { residence: { operatorId: null } },
      },
    ] as never);

    const assessment = evaluateSoinsRisk({
      residentId: "r1",
      signalCounts: { ABNORMAL_ACTIVITY: 1 },
      cameraInactive: true,
      familyConcernLevel: "none",
    });

    const plan = await planSoinsAiNotifications({ residentId: "r1", assessment });

    expect(plan.familyCameraNotifyUserIds).toEqual([]);
    expect(plan.suppressed.some((s) => s.audience === "family_camera_channel")).toBe(true);
  });
});
