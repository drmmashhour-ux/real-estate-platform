import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { ListingPreviewResponse } from "@/modules/autonomous-marketplace/types/listing-preview.types";
import { SyriaPreviewPanel } from "../SyriaPreviewPanel";

describe("SyriaPreviewPanel", () => {
  it("surfaces DRY_RUN and no-execution badges", () => {
    const preview = {
      listingId: "lst_1",
      autonomyMode: "OFF",
      metrics: null,
      signals: [],
      observation: {
        id: "obs",
        target: { type: "syria_listing", id: "lst_1" },
        signals: [],
        aggregates: {},
        facts: {},
        builtAt: new Date().toISOString(),
      },
      opportunities: [],
      proposedActions: [],
      policyDecisions: [],
      opportunityEvaluations: [],
      executionResult: {
        status: "DRY_RUN",
        startedAt: "",
        finishedAt: "",
        detail: "",
        metadata: {},
      },
      riskBuckets: { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 },
    } as ListingPreviewResponse;

    const html = renderToStaticMarkup(createElement(SyriaPreviewPanel, { listingId: "lst_1", preview }));
    expect(html).toContain("DRY_RUN");
    expect(html.toLowerCase()).toContain("no execution");
  });
});
