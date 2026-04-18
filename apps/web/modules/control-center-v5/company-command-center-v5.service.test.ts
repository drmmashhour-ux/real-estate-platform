import { describe, expect, it, vi } from "vitest";

vi.mock("@/modules/control-center-v4/company-command-center-v4.service", () => ({
  loadCompanyCommandCenterV4Payload: vi.fn(),
}));

import { loadCompanyCommandCenterV4Payload } from "@/modules/control-center-v4/company-command-center-v4.service";
import { loadCompanyCommandCenterV5Payload } from "./company-command-center-v5.service";
import { minimalV4Payload } from "./test-fixtures/v4-minimal";

describe("loadCompanyCommandCenterV5Payload", () => {
  it("maps four modes from V4", async () => {
    vi.mocked(loadCompanyCommandCenterV4Payload).mockResolvedValue(minimalV4Payload());
    const p = await loadCompanyCommandCenterV5Payload({});
    expect(p.modes.morningBrief.mode).toBe("morning_brief");
    expect(p.modes.incident.mode).toBe("incident");
    expect(p.shared.overallStatus).toBeDefined();
    expect(p.meta.sourcesUsed.some((s) => s.includes("control_center_v5"))).toBe(true);
  });
});
