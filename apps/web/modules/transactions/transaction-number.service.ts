import type { Prisma } from "@prisma/client";
import { logInfo } from "@/lib/logger";

const TAG = "[transaction.number.generate]";

/** Public display: LEC-SD-YYYY-###### — assigned once at creation; never mutated. */
const PREFIX = "LEC-SD";
const SEQ_WIDTH = 6;

export function formatTransactionNumber(year: number, sequence: number): string {
  return `${PREFIX}-${year}-${String(sequence).padStart(SEQ_WIDTH, "0")}`;
}

/**
 * Atomically allocate the next sequence for a calendar year (PostgreSQL INSERT…ON CONFLICT).
 * Must run inside the same interactive `prisma.$transaction` as `LecipmSdTransaction` creation.
 */
export async function allocateNextYearlySequence(tx: Prisma.TransactionClient, year: number): Promise<number> {
  const rows = await tx.$queryRaw<Array<{ seq: bigint }>>`
    INSERT INTO "lecipm_transaction_sd_sequences" ("year", "last_seq")
    VALUES (${year}, 1)
    ON CONFLICT ("year") DO UPDATE SET
      "last_seq" = "lecipm_transaction_sd_sequences"."last_seq" + 1
    RETURNING "last_seq" AS seq
  `;
  const n = rows[0]?.seq;
  if (n === undefined || n === null) {
    throw new Error("SD sequence allocation failed");
  }
  const out = Number(n);
  logInfo(`${TAG}`, { year, seq: out });
  return out;
}

export function buildNewTransactionNumber(year: number, sequence: number): string {
  return formatTransactionNumber(year, sequence);
}
