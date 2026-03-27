import { describe, expect, it } from "vitest";
import { computeSlaStateKind } from "@/lib/trustgraph/application/computeSlaState";
import { getPhase7EnterpriseConfig } from "@/lib/trustgraph/config/phase7-enterprise";
import { isWorkspaceReviewRole } from "@/lib/trustgraph/domain/workspaces";

describe("Phase 7 — SLA state", () => {
  it("classifies due soon vs on_track", () => {
    const cfg = getPhase7EnterpriseConfig();
    const now = new Date("2025-01-01T12:00:00Z");
    const dueSoon = new Date("2025-01-01T13:30:00Z");
    const onTrack = new Date("2025-01-05T12:00:00Z");
    expect(computeSlaStateKind(dueSoon, now, cfg)).toBe("due_soon");
    expect(computeSlaStateKind(onTrack, now, cfg)).toBe("on_track");
  });
});

describe("Phase 7 — workspace roles", () => {
  it("viewer is not a review role", () => {
    expect(isWorkspaceReviewRole("workspace_viewer")).toBe(false);
    expect(isWorkspaceReviewRole("workspace_reviewer")).toBe(true);
  });
});
