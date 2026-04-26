import { query } from "@/lib/sql";

/**
 * Store user-reported product feedback (Order 56). Append-only.
 */
export async function submitFeedback(userId: string, message: string) {
  await query(
    `
    INSERT INTO "Feedback" ("userId", message, "createdAt")
    VALUES ($1, $2, NOW())
  `,
    [userId, message]
  );
}
