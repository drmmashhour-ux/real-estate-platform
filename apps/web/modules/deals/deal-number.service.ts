import type { Prisma } from "@prisma/client";
import { logInfo } from "@/lib/logger";

const PREFIX = "LEC-DEAL";
const SEQ_WIDTH = 6;

const TAG = "[deal.number]";

export function formatDealNumber(year: number, sequence: number): string {
  return `${PREFIX}-${year}-${String(sequence).padStart(SEQ_WIDTH, "0")}`;
}

export async function allocateNextDealSequence(tx: Prisma.TransactionClient, year: number): Promise<number> {
  const rows = await tx.$queryRaw<Array<{ seq: bigint }>>`
    INSERT INTO "lecipm_deal_number_sequences" ("year", "last_seq")
    VALUES (${year}, 1)
    ON CONFLICT ("year") DO UPDATE SET
      "last_seq" = "lecipm_deal_number_sequences"."last_seq" + 1
    RETURNING "last_seq" AS seq
  `;
  const n = rows[0]?.seq;
  if (n === undefined || n === null) throw new Error("Deal sequence allocation failed");
  const out = Number(n);
  logInfo(`${TAG}`, { year, seq: out });
  return out;
}
