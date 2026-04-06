import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  readAutoCloseEnv,
  isUnansweredUserLastMessage,
  isStaleTimestamp,
  bookingCandidateForReminder,
} from "../autoCloseEngine";

describe("autoCloseEngine env gate", () => {
  let savedEnabled: string | undefined;
  let savedSafe: string | undefined;

  beforeEach(() => {
    savedEnabled = process.env.AI_AUTOCLOSE_ENABLED;
    savedSafe = process.env.AI_AUTOCLOSE_SAFE_MODE;
    delete process.env.AI_AUTOCLOSE_ENABLED;
    delete process.env.AI_AUTOCLOSE_SAFE_MODE;
  });

  afterEach(() => {
    if (savedEnabled === undefined) delete process.env.AI_AUTOCLOSE_ENABLED;
    else process.env.AI_AUTOCLOSE_ENABLED = savedEnabled;
    if (savedSafe === undefined) delete process.env.AI_AUTOCLOSE_SAFE_MODE;
    else process.env.AI_AUTOCLOSE_SAFE_MODE = savedSafe;
  });

  it("requires both ENABLED and SAFE_MODE=1", () => {
    expect(readAutoCloseEnv().envAllowsExecution).toBe(false);
    process.env.AI_AUTOCLOSE_ENABLED = "1";
    expect(readAutoCloseEnv().envAllowsExecution).toBe(false);
    process.env.AI_AUTOCLOSE_SAFE_MODE = "0";
    expect(readAutoCloseEnv().envAllowsExecution).toBe(false);
    process.env.AI_AUTOCLOSE_SAFE_MODE = "1";
    expect(readAutoCloseEnv().envAllowsExecution).toBe(true);
  });
});

describe("autoCloseEngine helpers", () => {
  it("detects unanswered thread (user spoke last)", () => {
    expect(isUnansweredUserLastMessage("user")).toBe(true);
    expect(isUnansweredUserLastMessage("ai")).toBe(false);
    expect(isUnansweredUserLastMessage("human")).toBe(false);
  });

  it("detects stale timestamps", () => {
    const old = new Date(Date.now() - 48 * 3600 * 1000);
    expect(isStaleTimestamp(old, 24 * 3600 * 1000)).toBe(true);
    expect(isStaleTimestamp(new Date(), 24 * 3600 * 1000)).toBe(false);
    expect(isStaleTimestamp(null, 1000)).toBe(false);
  });

  it("simulates stale PENDING booking drop for ops reminder window", () => {
    const now = Date.now();
    const fresh = new Date(now - 6 * 3600 * 1000);
    const stale = new Date(now - 20 * 3600 * 1000);
    const ancient = new Date(now - 20 * 24 * 3600 * 1000);
    expect(bookingCandidateForReminder({ status: "PENDING", createdAt: fresh, nowMs: now })).toBe(false);
    expect(bookingCandidateForReminder({ status: "PENDING", createdAt: stale, nowMs: now })).toBe(true);
    expect(bookingCandidateForReminder({ status: "CONFIRMED", createdAt: stale, nowMs: now })).toBe(false);
    expect(bookingCandidateForReminder({ status: "PENDING", createdAt: ancient, nowMs: now })).toBe(false);
  });
});
