import assert from "node:assert/strict";
import test from "node:test";
import { createHealth } from "@nexora/shared-types";

test("transaction service health is mock safe", () => {
  assert.equal(createHealth("transaction-service", "development").livePaymentsEnabled, false);
});
