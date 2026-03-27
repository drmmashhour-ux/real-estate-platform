import type { Prisma } from "@prisma/client";
import { generateUserCode } from "@/lib/codes/generate-code";

type Tx = Prisma.TransactionClient;

/** Unique `USR-XXXXXX` for new accounts (atomic sequence). */
export async function allocateUniqueUserCode(tx: Tx): Promise<string> {
  return generateUserCode(tx);
}
