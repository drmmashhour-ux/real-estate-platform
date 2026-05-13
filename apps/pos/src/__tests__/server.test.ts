import assert from "node:assert/strict";
import test from "node:test";
import { mockPosProducts } from "@merchant-payments/platform";

test("pos scaffold has mock products only", () => {
  assert.ok(mockPosProducts.length > 0);
});
