import { describe, expect, it } from "vitest";
import { classifyFailure } from "../../e2e/failures/classify-failure";
import type { E2EFailureContext } from "../../e2e/failures/types";

function baseCtx(over: Partial<E2EFailureContext> = {}): E2EFailureContext {
  return {
    scenarioName: "Test",
    scenarioSlug: "scenario-9-error",
    scenarioId: 9,
    stepName: "step",
    locale: "en",
    market: "default",
    role: "guest",
    route: "/",
    errorMessage: "x",
    timestamp: new Date().toISOString(),
    ...over,
  };
}

describe("classifyFailure", () => {
  it("classifies RTL when locale ar and layout hint", () => {
    const r = classifyFailure(
      baseCtx({
        locale: "ar",
        errorMessage: "expected html dir=rtl, got ltr",
        scenarioSlug: "scenario-3-arabic-rtl",
      }),
    );
    expect(r.type).toBe("rtl_layout");
  });

  it("classifies Stripe checkout from path hint", () => {
    const r = classifyFailure(
      baseCtx({
        errorMessage: "POST /api/stripe/checkout returned 500",
      }),
    );
    expect(r.type).toBe("stripe_checkout");
  });

  it("classifies manual payment", () => {
    const r = classifyFailure(
      baseCtx({
        errorMessage: "manual-payment 403: forbidden",
        scenarioSlug: "scenario-2-syria-manual",
      }),
    );
    expect(r.type).toBe("manual_payment");
  });

  it("classifies infra blocked", () => {
    const r = classifyFailure(
      baseCtx({
        errorMessage: "net::ERR_CONNECTION_REFUSED",
      }),
    );
    expect(r.type).toBe("infra_blocked");
  });
});
