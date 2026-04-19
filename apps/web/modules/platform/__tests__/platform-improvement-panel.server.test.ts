import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PlatformImprovementPanel } from "@/components/platform/PlatformImprovementPanel";
import { mergeTestPlatformReviewSnapshot } from "@/modules/platform/platform-review-snapshot";
import {
  buildExecutionPanelModel,
  resetPlatformImprovementStateForTests,
  statusesByPriorityIdFromDoc,
  syncExecutionStateWithBundle,
} from "@/modules/platform/platform-improvement-state.service";
import { buildWeeklyFocusList } from "@/modules/platform/platform-improvement-priority.service";
import { buildFullPlatformImprovementBundle } from "@/modules/platform/platform-improvement-review.service";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
}));

describe("PlatformImprovementPanel (server render)", () => {
  beforeEach(() => {
    resetPlatformImprovementStateForTests();
  });
  afterEach(() => {
    resetPlatformImprovementStateForTests();
  });

  it("renders Go fix link and follow-through strip", async () => {
    const bundle = buildFullPlatformImprovementBundle(mergeTestPlatformReviewSnapshot({}));
    syncExecutionStateWithBundle(bundle);
    const execution = buildExecutionPanelModel(bundle);
    const weeklyFocus = buildWeeklyFocusList(bundle.priorities, statusesByPriorityIdFromDoc());
    const html = renderToStaticMarkup(
      React.createElement(PlatformImprovementPanel, {
        bundle,
        execution,
        weeklyFocus,
        recentHistory: [],
      }),
    );
    expect(html).toContain("Go fix →");
    expect(html).toContain("/admin/");
    expect(html).toContain("Follow-through");
  });

  it("shows clean empty copy when monetization gaps are empty", async () => {
    const bundle = buildFullPlatformImprovementBundle(mergeTestPlatformReviewSnapshot({}));
    const b = {
      ...bundle,
      monetization: { ...bundle.monetization, highPriorityMonetizationGaps: [] },
    };
    syncExecutionStateWithBundle(b);
    const execution = buildExecutionPanelModel(b);
    const weeklyFocus = buildWeeklyFocusList(b.priorities, statusesByPriorityIdFromDoc());
    const html = renderToStaticMarkup(
      React.createElement(PlatformImprovementPanel, {
        bundle: b,
        execution,
        weeklyFocus,
        recentHistory: [],
      }),
    );
    expect(html).toContain("No major gaps flagged here");
  });

  it("shows trust clean state when coverage gaps empty", async () => {
    const bundle = buildFullPlatformImprovementBundle(mergeTestPlatformReviewSnapshot({}));
    const b = {
      ...bundle,
      trust: { ...bundle.trust, coverageGaps: [] },
    };
    syncExecutionStateWithBundle(b);
    const execution = buildExecutionPanelModel(b);
    const weeklyFocus = buildWeeklyFocusList(b.priorities, statusesByPriorityIdFromDoc());
    const html = renderToStaticMarkup(
      React.createElement(PlatformImprovementPanel, {
        bundle: b,
        execution,
        weeklyFocus,
        recentHistory: [],
      }),
    );
    expect(html).toContain("Trust coverage");
    expect(html).toContain("No major gaps flagged here");
  });
});
