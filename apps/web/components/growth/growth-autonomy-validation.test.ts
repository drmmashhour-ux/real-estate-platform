import * as React from "react";
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { GrowthAutonomyRolloutStatusPanel } from "./GrowthAutonomyRolloutStatusPanel";
import { GrowthAutonomyValidationChecklist } from "./GrowthAutonomyValidationChecklist";

describe("growth autonomy validation UI", () => {
  it("renders rollout status labels", () => {
    const html = renderToStaticMarkup(
      React.createElement(GrowthAutonomyRolloutStatusPanel, {
        rolloutStage: "internal",
        autonomyEnabled: true,
        panelEnabled: true,
        killSwitch: false,
        enforcementLayerFlagOn: true,
        viewerGrowthAutonomyPilotAccess: true,
        apiRolloutStatus: {
          rolloutMode: "internal",
          autonomyEnabled: true,
          panelEnabled: true,
          killSwitchEnabled: false,
          enforcementAvailable: true,
          internalGateBlocked: false,
          snapshotDelivered: true,
          viewerInternalPilotEligible: true,
          partialExposureNote: null,
        },
        snapshotSummary: {
          createdAt: "2026-04-02T12:00:00.000Z",
          enforcementInputPartial: false,
          operatorNotesCount: 1,
          warningAttentionCount: 2,
        },
        enforcementSnapshotPresent: true,
      }),
    );
    expect(html).toContain("Autonomy rollout status");
    expect(html).toContain("internal");
    expect(html).toContain("Last snapshot");
  });

  it("renders validation checklist items", () => {
    const html = renderToStaticMarkup(
      React.createElement(GrowthAutonomyValidationChecklist, { showValidationNotes: true }),
    );
    expect(html).toContain("Operator validation checklist");
    expect(html).toContain("No risky auto-execution");
    expect(html).toContain("What looked correct");
  });
});
