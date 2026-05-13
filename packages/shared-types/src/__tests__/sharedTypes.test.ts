import assert from "node:assert/strict";
import test from "node:test";
import { assertSafeRuntimeConfig, createCorrelationId, resolveEnvironment } from "../index.js";

test("runtime config rejects live payment settings", () => {
  assert.equal(resolveEnvironment("staging"), "staging");
  assert.match(createCorrelationId(), /^[0-9a-f-]{36}$/);
  assert.throws(
    () => assertSafeRuntimeConfig({ NEXORA_ENV: "production", LIVE_PAYMENTS_ENABLED: "true" }),
    /Unsafe live payment/,
  );
});
