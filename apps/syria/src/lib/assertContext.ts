/**
 * Darlink (`apps/syria`) — single entry for APP_CONTEXT checks.
 * Re-exports guards from `guard.ts`; use `assertDarlinkRuntimeEnv()` at server boundaries.
 */

export {
  assertDarlinkContext,
  assertDarlinkRuntimeEnv,
  ISOLATION_VIOLATION_MSG,
} from "./guard";

/** Alias for tooling / symmetry with apps/web `assertAppContext`. */
export { assertDarlinkRuntimeEnv as assertAppContext } from "./guard";
