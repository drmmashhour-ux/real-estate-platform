import assert from "node:assert/strict";
import test from "node:test";
import { assertSafeRuntimeConfig } from "@nexora/shared-types";

test("api gateway runtime rejects live payment env", () => {
  assert.throws(() => assertSafeRuntimeConfig({ LIVE_PAYMENTS_ENABLED: "1" }), /Unsafe live payment/);
});
