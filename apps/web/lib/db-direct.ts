/**
 * @deprecated Order 81.1 — use `import { pool, getPoolStats, query } from "@/lib/db"` only.
 * Re-exports the shared pool from {@link ./db/pool-core.ts} (the only `new Pool` in the app).
 */
export { pool, getPoolStats } from "./db/pool-core";
