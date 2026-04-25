import { describe, expect, it, beforeEach } from "vitest";
import {
  _resetCallStoreForTests,
  endCallSession,
  getCallSession,
  startCallSession,
  trackCallEvent,
} from "../call-session.service";

beforeEach(() => {
  _resetCallStoreForTests();
});

describe("call-session.service", () => {
  it("starts and ends a session", () => {
    const s = startCallSession({
      conversationId: "c1",
      brokerId: "b1",
      clientId: "u1",
    });
    expect(s.ok).toBe(true);
    if (!s.ok) return;
    expect(s.session.status).toBe("active");
    const e = endCallSession(s.session.id);
    expect(e.ok).toBe(true);
    if (e.ok) {
      expect(e.session.status).toBe("ended");
      expect(e.session.durationSec).not.toBeNull();
    }
  });

  it("tracks events on active call", () => {
    const s = startCallSession({ conversationId: "c1", brokerId: "b1", clientId: "u1" });
    if (!s.ok) throw new Error("no session");
    const t = trackCallEvent(s.session.id, {
      timestamp: new Date().toISOString(),
      type: "long_pause",
    });
    expect(t.ok).toBe(true);
  });
});
