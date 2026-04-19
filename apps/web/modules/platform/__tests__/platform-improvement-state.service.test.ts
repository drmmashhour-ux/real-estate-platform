import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mergeTestPlatformReviewSnapshot } from "../platform-review-snapshot";
import { buildFullPlatformImprovementBundle } from "../platform-improvement-review.service";
import {
  computeExecutionFollowThrough,
  resetPlatformImprovementStateForTests,
  setPriorityStatus,
  syncExecutionStateWithBundle,
} from "../platform-improvement-state.service";

describe("platform-improvement-state.service", () => {
  beforeEach(() => {
    resetPlatformImprovementStateForTests();
  });
  afterEach(() => {
    resetPlatformImprovementStateForTests();
  });

  it("persists transitions and updates follow-through counts", async () => {
    const bundle = buildFullPlatformImprovementBundle(mergeTestPlatformReviewSnapshot({}));
    if (bundle.priorities.length === 0) return;
    syncExecutionStateWithBundle(bundle);
    const before = computeExecutionFollowThrough(bundle.priorities);
    expect(before.total).toBe(bundle.priorities.length);

    const first = bundle.priorities[0]!;
    let r = await setPriorityStatus(first.id, "acknowledged");
    expect(r.ok).toBe(true);
    const ftAfterAck = computeExecutionFollowThrough(bundle.priorities);
    expect(ftAfterAck.newCount).toBe(Math.max(0, before.newCount - 1));

    r = await setPriorityStatus(first.id, "planned");
    expect(r.ok).toBe(true);
    r = await setPriorityStatus(first.id, "in_progress");
    expect(r.ok).toBe(true);
    r = await setPriorityStatus(first.id, "done");
    expect(r.ok).toBe(true);
    const ftFinal = computeExecutionFollowThrough(bundle.priorities);
    expect(ftFinal.completed).toBeGreaterThanOrEqual(1);
  });

  it("blocks invalid transitions", async () => {
    const bundle = buildFullPlatformImprovementBundle(mergeTestPlatformReviewSnapshot({}));
    if (bundle.priorities.length === 0) return;
    syncExecutionStateWithBundle(bundle);
    const first = bundle.priorities[0]!;
    const r = await setPriorityStatus(first.id, "done");
    expect(r.ok).toBe(false);
  });
});
