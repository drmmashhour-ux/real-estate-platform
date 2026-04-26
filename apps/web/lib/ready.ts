import { pool } from "./db/index";

let isReady = false;

/**
 * Order 75 — low-level TCP pool probe (independent of Prisma / `prismaWithCoreFallback`).
 * For load balancers: pair with `GET /api/ready` which also checks app config.
 */
export async function checkReady(): Promise<boolean> {
  try {
    await pool.query("SELECT 1");
    isReady = true;
  } catch {
    isReady = false;
  }
  return isReady;
}
