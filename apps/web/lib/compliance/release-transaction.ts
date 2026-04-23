/**
 * LECIPM transaction release gate — re-exports unified `canReleaseTransaction` (includes registry #, inspection, guardrails).
 */
export {
  assertTransactionRelease,
  canReleaseTransaction,
  type TransactionReleaseInput,
} from "@/lib/compliance/release";
