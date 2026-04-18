/**
 * Queue lifecycle — status transitions only (no deletes). Stale handling lives in `stale-action.service`.
 */
export { runStaleActionSweep } from "./stale-action.service";
