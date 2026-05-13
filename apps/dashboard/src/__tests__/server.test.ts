import assert from "node:assert/strict";
import test from "node:test";
import { createBrandIdentity } from "@merchant-payments/platform";

test("dashboard uses Nexora brand scaffold", () => {
  assert.equal(createBrandIdentity().brandName, "Nexora");
});
