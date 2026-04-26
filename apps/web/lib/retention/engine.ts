import { query } from "@/lib/sql";

export type InactiveUserRow = { id: string; email: string };

/**
 * Users with no recent activity (Order 53). Uses `last_active_at` when set, else
 * `createdAt` (coalesce) so new installs without a heartbeat are still catchable.
 */
export async function findInactiveUsers() {
  return await query<InactiveUserRow>(`
    SELECT u.id, u.email
    FROM "User" u
    WHERE COALESCE(u."last_active_at", u."createdAt") < NOW() - INTERVAL '3 days'
  `);
}

/**
 * Placeholder: wire to email/push/in-app. Currently logs to verify cron wiring.
 */
export async function triggerReengagement() {
  const users = await findInactiveUsers();
  for (const user of users) {
    console.log(`Send reminder to ${user.email}`);
  }
}
