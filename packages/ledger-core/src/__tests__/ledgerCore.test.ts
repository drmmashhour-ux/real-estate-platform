import assert from "node:assert/strict";
import test from "node:test";
import { createLedgerAccount, LedgerEngine } from "../index.js";

test("ledger core package exports ledger primitives", () => {
  const ledger = new LedgerEngine();
  const account = ledger.addAccount(createLedgerAccount({ type: "settlement_account", currency: "USD" }));
  assert.equal(account.type, "settlement_account");
});
