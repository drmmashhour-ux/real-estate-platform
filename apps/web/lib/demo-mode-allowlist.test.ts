import { describe, expect, it } from "vitest";
import { isDemoModeApiMutationAllowed } from "./demo-mode-allowlist";

describe("demo mode API mutation allowlist", () => {
  it("allows explicit safe demo mutations", () => {
    expect(isDemoModeApiMutationAllowed("/api/auth/demo-session", "post")).toBe(true);
    expect(isDemoModeApiMutationAllowed("/api/feedback", "POST")).toBe(true);
    expect(isDemoModeApiMutationAllowed("/api/bnhub/bookings/demo", "PATCH")).toBe(true);
  });

  it("blocks unlisted write endpoints by default", () => {
    expect(isDemoModeApiMutationAllowed("/api/internal/payouts/run", "POST")).toBe(false);
    expect(isDemoModeApiMutationAllowed("/api/admin/users", "DELETE")).toBe(false);
  });

  it("honors method-specific rules", () => {
    expect(isDemoModeApiMutationAllowed("/api/auth/login", "POST")).toBe(true);
    expect(isDemoModeApiMutationAllowed("/api/auth/login", "DELETE")).toBe(false);
  });
});
