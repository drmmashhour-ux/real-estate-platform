import { describe, expect, it, vi } from "vitest";

vi.mock("@/modules/control-center-v3/company-command-center-v3.service", () => ({
  loadCompanyCommandCenterV3Payload: vi.fn(),
}));

import { loadCompanyCommandCenterV3Payload } from "@/modules/control-center-v3/company-command-center-v3.service";
import { loadCompanyCommandCenterV4Payload } from "./company-command-center-v4.service";
import { minimalV3Payload } from "./test-fixtures/v3-minimal";

describe("loadCompanyCommandCenterV4Payload", () => {
  it("merges briefing digest and deltas", async () => {
    const a = minimalV3Payload();
    const b = minimalV3Payload();
    vi.mocked(loadCompanyCommandCenterV3Payload).mockResolvedValueOnce(a).mockResolvedValueOnce(b);

    const p = await loadCompanyCommandCenterV4Payload({});
    expect(p.v3.shared.systems).toBeDefined();
    expect(p.presets.length).toBeGreaterThan(0);
    expect(p.meta.cardsGenerated).toBeGreaterThanOrEqual(0);
  });
});
