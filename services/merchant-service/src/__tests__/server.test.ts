import assert from "node:assert/strict";
import test from "node:test";
import { assertSafeRuntimeConfig } from "@nexora/shared-types";

test("merchant service rejects unsafe configs", () => {
  assert.throws(() => assertSafeRuntimeConfig({ STRIPE_SECRET_KEY: "secret" }), /Unsafe live payment/);
});
