import { describe, expect, it } from "vitest";

import { mapAutonomyStatusToMarketplaceUi } from "../marketplace-optimization-approval.service";

describe("marketplace optimization approval mapping", () => {
  it("maps applied autonomy statuses to IMPLEMENTED", () => {
    expect(mapAutonomyStatusToMarketplaceUi("APPLIED")).toBe("IMPLEMENTED");
    expect(mapAutonomyStatusToMarketplaceUi("AUTO_APPLIED")).toBe("IMPLEMENTED");
  });

  it("preserves terminal human-review states", () => {
    expect(mapAutonomyStatusToMarketplaceUi("PROPOSED")).toBe("PROPOSED");
    expect(mapAutonomyStatusToMarketplaceUi("APPROVED")).toBe("APPROVED");
    expect(mapAutonomyStatusToMarketplaceUi("REJECTED")).toBe("REJECTED");
    expect(mapAutonomyStatusToMarketplaceUi("EXPIRED")).toBe("EXPIRED");
  });

  it("treats rolled-back / invalid rows as rejected for operator UX", () => {
    expect(mapAutonomyStatusToMarketplaceUi("ROLLED_BACK")).toBe("REJECTED");
    expect(mapAutonomyStatusToMarketplaceUi("INVALID")).toBe("REJECTED");
  });
});
