import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  monolithPrisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

import * as identity from "../identityGateForPublish";
import { HOST_PUBLISH_IDENTITY_ERROR_MESSAGE, HostPublishIdentityError } from "../identityGateForPublish";

/**
 * `requireHostIdentityForShortTermPublish` delegates to `assertUserEmailPhoneVerifiedForPublish`
 * (see identityGateForPublish: `FEATURE_COMPLIANCE_HARD_LOCK` is applied inside the assert call).
 * Here we unit-test the throw / resolve surface for BNHub host publish.
 */
describe("host publish identity gate", () => {
  let assertSpy: ReturnType<typeof vi.spyOn<typeof identity, "assertUserEmailPhoneVerifiedForPublish">>;

  beforeEach(() => {
    assertSpy = vi.spyOn(identity, "assertUserEmailPhoneVerifiedForPublish");
  });

  afterEach(() => {
    assertSpy.mockRestore();
  });

  it("HARD path: unverified (assert not ok) → throws HostPublishIdentityError with fixed message", async () => {
    assertSpy.mockResolvedValue({ ok: false, message: "Phone verification required before listing can go live." });
    await expect(identity.requireHostIdentityForShortTermPublish("u-1")).rejects.toBeInstanceOf(HostPublishIdentityError);
    await expect(identity.requireHostIdentityForShortTermPublish("u-1")).rejects.toMatchObject({
      message: HOST_PUBLISH_IDENTITY_ERROR_MESSAGE,
    });
  });

  it("HARD path: verified (assert ok) → resolves", async () => {
    assertSpy.mockResolvedValue({ ok: true });
    await expect(identity.requireHostIdentityForShortTermPublish("u-2")).resolves.toBeUndefined();
  });
});

describe("host publish API error shape", () => {
  it("uses stable 403 error string for clients", () => {
    expect(new HostPublishIdentityError().message).toBe("Identity verification required before publishing");
  });
});
