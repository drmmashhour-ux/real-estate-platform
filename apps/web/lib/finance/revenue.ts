import { randomUUID } from "node:crypto";

import { query } from "@/lib/sql";

/**
 * Shadow revenue line (BNHub `ShortTermListing.id`). Complements Stripe/ledger; not payment source of truth.
 */
export async function recordTransaction(data: {
  listingId: string;
  amount: number;
  fee: number;
  hostPayout: number;
}): Promise<void> {
  const id = randomUUID();
  await query(
    `
    INSERT INTO "marketplace_revenue_entries"
      ("id", "listing_id", "amount", "fee", "host_payout", "created_at")
    VALUES ($1, $2, $3, $4, $5, NOW())
  `,
    [id, data.listingId, data.amount, data.fee, data.hostPayout]
  );
}
