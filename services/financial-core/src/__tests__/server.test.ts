import assert from "node:assert/strict";
import test from "node:test";
import { assertFinancialSafety } from "@merchant-payments/platform";

test("financial core remains mock-only", () => {
  assert.equal(assertFinancialSafety({}).liveExecutionAllowed, false);
});
