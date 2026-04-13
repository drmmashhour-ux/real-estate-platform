import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { signOAuthState, verifyOAuthState } from "../state-signing";

describe("state-signing", () => {
  const prev = { ...process.env };

  beforeEach(() => {
    process.env.OAUTH_STATE_SECRET = "test-secret-for-hmac-signing-only";
    delete process.env.META_APP_SECRET;
  });

  afterEach(() => {
    process.env = { ...prev };
  });

  it("round-trips signed payload", () => {
    const t = signOAuthState({ userId: "u-1", provider: "meta", exp: Date.now() + 60_000 });
    const v = verifyOAuthState<{ userId: string; provider: string }>(t);
    expect(v?.userId).toBe("u-1");
    expect(v?.provider).toBe("meta");
  });

  it("rejects tampered state", () => {
    const t = signOAuthState({ userId: "u-1", exp: Date.now() + 60_000 });
    const bad = t.slice(0, -4) + "xxxx";
    expect(verifyOAuthState(bad)).toBeNull();
  });
});
